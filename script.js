// Global variables
let warehouses = [];
let scene, camera, renderer, controls;
let truckMeshes = [];
let palletMeshes = [];
let raycaster, mouse;
let selectedPallet = null;
let previousMultiView = null; // Store multi-warehouse view state

// Bilico dimensions (in meters)
const TRUCK_LENGTH = 13.6;
const TRUCK_WIDTH = 2.5;
const TRUCK_HEIGHT = 2.6;
const MAX_WEIGHT = 25000; // 25 tons in kg

// Color palette for same-sized pallets
const COLOR_PALETTE = [
    0x3b82f6, // Blue
    0x10b981, // Emerald
    0xf59e0b, // Amber
    0xef4444, // Red
    0x8b5cf6, // Violet
    0x06b6d4, // Cyan
    0xf97316, // Orange
    0x84cc16, // Lime
    0xec4899, // Pink
    0x6366f1, // Indigo
];

// Initialize with one warehouse
document.addEventListener('DOMContentLoaded', function() {
    addWarehouse();
    initThreeJS();
});

// Add a new warehouse section
function addWarehouse() {
    const form = document.getElementById('warehousesForm');
    const warehouseIndex = warehouses.length;
    
    const warehouse = document.createElement('div');
    warehouse.className = 'warehouse-section bg-white/5 rounded-xl p-4 border border-white/10';
    warehouse.id = `warehouse-${warehouseIndex}`;
    warehouse.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <span class="text-white font-semibold text-lg">🏭 Magazzino ${String.fromCharCode(65 + warehouseIndex)}</span>
            <button onclick="removeWarehouse(${warehouseIndex})" class="remove-btn">Rimuovi</button>
        </div>
        <div id="palletForm-${warehouseIndex}" class="space-y-3">
            <!-- Pallet rows will be added here -->
        </div>
        <button onclick="addPalletRow(${warehouseIndex})" class="mt-3 w-full bg-blue-600/50 hover:bg-blue-600/70 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm">
            + Aggiungi Pallet
        </button>
    `;
    
    form.appendChild(warehouse);
    warehouses.push({ id: warehouseIndex, name: String.fromCharCode(65 + warehouseIndex) });
    
    // Add one pallet row by default
    addPalletRow(warehouseIndex);
}

// Remove a warehouse
function removeWarehouse(index) {
    const warehouse = document.getElementById(`warehouse-${index}`);
    if (warehouse) {
        warehouse.remove();
        warehouses = warehouses.filter(w => w.id !== index);
        // Re-index remaining warehouses
        document.querySelectorAll('.warehouse-section').forEach((wh, i) => {
            wh.querySelector('span').textContent = `🏭 Magazzino ${String.fromCharCode(65 + i)}`;
            wh.querySelector('.remove-btn').onclick = () => removeWarehouse(i);
            wh.id = `warehouse-${i}`;
        });
    }
}

// Add a new pallet row to a specific warehouse
function addPalletRow(warehouseIndex) {
    const form = document.getElementById(`palletForm-${warehouseIndex}`);
    const rowIndex = document.querySelectorAll(`#palletForm-${warehouseIndex} .pallet-row`).length;
    
    const row = document.createElement('div');
    row.className = 'pallet-row';
    row.id = `pallet-${warehouseIndex}-${rowIndex}`;
    row.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="text-white/80 text-sm">Pallet #${rowIndex + 1}</span>
            <button onclick="removePalletRow(${warehouseIndex}, ${rowIndex})" class="remove-btn text-xs py-1 px-2">X</button>
        </div>
        <div class="input-group">
            <div>
                <div class="input-label">Quantità</div>
                <input type="number" id="quantity-${warehouseIndex}-${rowIndex}" placeholder="1" step="1" min="1" value="1">
            </div>
            <div>
                <div class="input-label">Lunghezza (m)</div>
                <input type="number" id="length-${warehouseIndex}-${rowIndex}" placeholder="1.2" step="0.01" min="0.1" value="1.2">
            </div>
            <div>
                <div class="input-label">Larghezza (m)</div>
                <input type="number" id="width-${warehouseIndex}-${rowIndex}" placeholder="0.8" step="0.01" min="0.1" value="0.8">
            </div>
            <div>
                <div class="input-label">Altezza (m)</div>
                <input type="number" id="height-${warehouseIndex}-${rowIndex}" placeholder="1.5" step="0.01" min="0.1" value="1.5">
            </div>
            <div>
                <div class="input-label">Peso (kg)</div>
                <input type="number" id="weight-${warehouseIndex}-${rowIndex}" placeholder="500" step="1" min="1" value="500">
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="stackable-${warehouseIndex}-${rowIndex}" checked>
                <label for="stackable-${warehouseIndex}-${rowIndex}">Sovrapponibile</label>
            </div>
        </div>
    `;
    
    form.appendChild(row);
}

// Remove a pallet row
function removePalletRow(warehouseIndex, rowIndex) {
    const row = document.getElementById(`pallet-${warehouseIndex}-${rowIndex}`);
    if (row) {
        row.remove();
        // Re-index remaining rows
        const form = document.getElementById(`palletForm-${warehouseIndex}`);
        form.querySelectorAll('.pallet-row').forEach((row, i) => {
            row.querySelector('span').textContent = `Pallet #${i + 1}`;
            row.querySelector('.remove-btn').onclick = () => removePalletRow(warehouseIndex, i);
            row.id = `pallet-${warehouseIndex}-${i}`;
        });
    }
}

// Collect all pallet data from all warehouses
function collectAllPalletData() {
    const data = [];
    
    warehouses.forEach(warehouse => {
        const form = document.getElementById(`palletForm-${warehouse.id}`);
        const rows = form.querySelectorAll('.pallet-row');
        
        rows.forEach((row, rowIndex) => {
            const quantity = parseInt(document.getElementById(`quantity-${warehouse.id}-${rowIndex}`).value) || 1;
            const length = parseFloat(document.getElementById(`length-${warehouse.id}-${rowIndex}`).value) || 0;
            const width = parseFloat(document.getElementById(`width-${warehouse.id}-${rowIndex}`).value) || 0;
            const height = parseFloat(document.getElementById(`height-${warehouse.id}-${rowIndex}`).value) || 0;
            const weight = parseFloat(document.getElementById(`weight-${warehouse.id}-${rowIndex}`).value) || 0;
            const stackable = document.getElementById(`stackable-${warehouse.id}-${rowIndex}`).checked;
            
            if (length > 0 && width > 0 && height > 0 && weight > 0 && quantity > 0) {
                // Weight is total weight for this row, divide by quantity for individual pallet
                const individualWeight = weight / quantity;
                
                for (let i = 0; i < quantity; i++) {
                    data.push({
                        id: `${warehouse.id}-${rowIndex}-${i}`,
                        warehouseId: warehouse.id,
                        warehouseName: warehouse.name,
                        length,
                        width,
                        height,
                        weight: individualWeight,
                        totalWeight: weight,
                        stackable
                    });
                }
            }
        });
    });
    
    return data;
}

// Get color based on pallet dimensions
function getColorForPallet(length, width, height) {
    // Create a hash of the dimensions
    const dimensions = `${length.toFixed(2)}x${width.toFixed(2)}x${height.toFixed(2)}`;
    let hash = 0;
    for (let i = 0; i < dimensions.length; i++) {
        hash = dimensions.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to select a color from the palette
    const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[colorIndex];
}

// 3D Bin Packing Algorithm
function packPallets(palletData, respectWarehouseOrder = false) {
    // Sort pallets by base area (larger first) for better packing
    const sortedPallets = [...palletData].sort((a, b) => {
        const areaA = a.length * a.width;
        const areaB = b.length * b.width;
        return areaB - areaA;
    });
    
    // If respecting warehouse order, sort by warehouse first
    if (respectWarehouseOrder) {
        sortedPallets.sort((a, b) => {
            if (a.warehouseId !== b.warehouseId) {
                return a.warehouseId - b.warehouseId;
            }
            // Within same warehouse, sort by area
            const areaA = a.length * a.width;
            const areaB = b.length * b.width;
            return areaB - areaA;
        });
    }
    
    const placedPallets = [];
    const unplacedPallets = [];
    
    // Create a 3D grid representation of the truck
    const cellSize = 0.1; // 10cm resolution (faster, less precise)
    const gridLength = Math.ceil(TRUCK_LENGTH / cellSize);
    const gridWidth = Math.ceil(TRUCK_WIDTH / cellSize);
    const gridHeight = Math.ceil(TRUCK_HEIGHT / cellSize);
    
    // 3D array to track occupied space
    const occupied = Array(gridHeight).fill(null).map(() => 
        Array(gridWidth).fill(null).map(() => 
            Array(gridLength).fill(false)
        )
    );
    
    // Track which warehouse occupies which section of the truck
    const warehouseSections = {};
    
    // Function to check if a position is valid
    function canPlace(pallet, x, y, z, rotated) {
        const pLength = rotated ? pallet.width : pallet.length;
        const pWidth = rotated ? pallet.length : pallet.width;
        const pHeight = pallet.height;
        
        const startL = Math.floor(x / cellSize);
        const startW = Math.floor(y / cellSize);
        const startH = Math.floor(z / cellSize);
        const endL = Math.ceil((x + pLength) / cellSize);
        const endW = Math.ceil((y + pWidth) / cellSize);
        const endH = Math.ceil((z + pHeight) / cellSize);
        
        // Check bounds
        if (x + pLength > TRUCK_LENGTH || y + pWidth > TRUCK_WIDTH || z + pHeight > TRUCK_HEIGHT) {
            return false;
        }
        
        // Check if space is occupied
        for (let h = startH; h < endH; h++) {
            for (let w = startW; w < endW; w++) {
                for (let l = startL; l < endL; l++) {
                    if (occupied[h][w][l]) {
                        return false;
                    }
                }
            }
        }
        
        // If respecting warehouse order, check if this section is already occupied by a different warehouse
        if (respectWarehouseOrder) {
            const midX = x + pLength / 2;
            for (const whId in warehouseSections) {
                if (whId !== String(pallet.warehouseId)) {
                    const section = warehouseSections[whId];
                    if (midX >= section.start && midX <= section.end) {
                        return false; // Would overlap with different warehouse
                    }
                }
            }
        }
        
        return true;
    }
    
    // Function to mark space as occupied
    function markOccupied(pallet, x, y, z, rotated) {
        const pLength = rotated ? pallet.width : pallet.length;
        const pWidth = rotated ? pallet.length : pallet.width;
        const pHeight = pallet.height;
        
        const startL = Math.floor(x / cellSize);
        const startW = Math.floor(y / cellSize);
        const startH = Math.floor(z / cellSize);
        const endL = Math.ceil((x + pLength) / cellSize);
        const endW = Math.ceil((y + pWidth) / cellSize);
        const endH = Math.ceil((z + pHeight) / cellSize);
        
        for (let h = startH; h < endH; h++) {
            for (let w = startW; w < endW; w++) {
                for (let l = startL; l < endL; l++) {
                    occupied[h][w][l] = true;
                }
            }
        }
        
        // Track warehouse section
        if (respectWarehouseOrder) {
            const whId = String(pallet.warehouseId);
            if (!warehouseSections[whId]) {
                warehouseSections[whId] = { start: x, end: x + pLength };
            } else {
                warehouseSections[whId].end = Math.max(warehouseSections[whId].end, x + pLength);
            }
        }
    }
    
    // Try to place each pallet with orientation optimization
    for (const pallet of sortedPallets) {
        let placed = false;
        let bestPosition = null;
        let bestOrientation = false;
        let bestLinearPosition = Infinity;
        
        // For warehouse order, constrain placement to warehouse section
        let minX = 0;
        let maxX = TRUCK_LENGTH;
        
        if (respectWarehouseOrder && warehouseSections[String(pallet.warehouseId)]) {
            minX = warehouseSections[String(pallet.warehouseId)].start;
            maxX = warehouseSections[String(pallet.warehouseId)].end;
        }
        
        // Try both orientations and find the one that minimizes linear space
        for (const rotated of [false, true]) {
            const pLength = rotated ? pallet.width : pallet.length;
            
            // Try to place at the bottom (z=0)
            for (let x = minX; x <= maxX - pLength; x += cellSize) {
                for (let y = 0; y <= TRUCK_WIDTH - (rotated ? pallet.length : pallet.width); y += cellSize) {
                    if (canPlace(pallet, x, y, 0, rotated)) {
                        const linearPosition = x + pLength;
                        if (linearPosition < bestLinearPosition) {
                            bestLinearPosition = linearPosition;
                            bestPosition = { x, y, z: 0 };
                            bestOrientation = rotated;
                            placed = true;
                        }
                    }
                }
            }
            
            // If stackable, try to place on top of other pallets from SAME warehouse
            if (pallet.stackable) {
                for (const placedPallet of placedPallets) {
                    // Only stack on pallets from same warehouse
                    if (String(placedPallet.warehouseId) !== String(pallet.warehouseId)) continue;
                    
                    const topZ = placedPallet.z + placedPallet.height;
                    
                    // Check if stacking would exceed height limit
                    if (topZ + pallet.height > TRUCK_HEIGHT) continue;
                    
                    for (let x = placedPallet.x; x <= placedPallet.x + (placedPallet.rotated ? placedPallet.width : placedPallet.length) - pLength; x += cellSize) {
                        for (let y = placedPallet.y; y <= placedPallet.y + (placedPallet.rotated ? placedPallet.length : placedPallet.width) - (rotated ? pallet.length : pallet.width); y += cellSize) {
                            if (canPlace(pallet, x, y, topZ, rotated)) {
                                const linearPosition = x + pLength;
                                // Prefer stacking even if linear position is slightly worse (1.5x tolerance)
                                if (linearPosition < bestLinearPosition * 1.5) {
                                    bestLinearPosition = linearPosition;
                                    bestPosition = { x, y, z: topZ };
                                    bestOrientation = rotated;
                                    placed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (placed && bestPosition) {
            markOccupied(pallet, bestPosition.x, bestPosition.y, bestPosition.z, bestOrientation);
            placedPallets.push({
                ...pallet,
                x: bestPosition.x,
                y: bestPosition.y,
                z: bestPosition.z,
                rotated: bestOrientation
            });
        } else {
            unplacedPallets.push(pallet);
        }
    }
    
    return { placedPallets, unplacedPallets };
}

// Initialize Three.js
function initThreeJS() {
    const container = document.getElementById('threeContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(20, 15, 20);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground
    
    // Raycaster for click detection
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Click handler
    renderer.domElement.addEventListener('click', onMouseClick, false);
    
    // Keyboard shortcuts for navigation
    document.addEventListener('keydown', onKeyDown);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

// Handle mouse click on pallets
function onMouseClick(event) {
    const container = document.getElementById('threeContainer');
    const rect = renderer.domElement.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Get all pallet meshes
    const palletMeshesOnly = palletMeshes.filter(mesh => mesh.isMesh);
    const intersects = raycaster.intersectObjects(palletMeshesOnly);
    
    // Remove previous selection highlight
    if (selectedPallet) {
        selectedPallet.material.emissive.setHex(0x000000);
    }
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        selectedPallet = clickedMesh;
        
        // Highlight selected pallet
        clickedMesh.material.emissive.setHex(0x333333);
        
        // Show dimensions in UI
        const palletData = clickedMesh.userData;
        if (palletData) {
            const dimensions = `${palletData.length.toFixed(2)}m × ${palletData.width.toFixed(2)}m × ${palletData.height.toFixed(2)}m`;
            const weight = `${palletData.totalWeight.toFixed(1)}kg`;
            const warehouse = palletData.warehouseName || '';
            
            alert(`📦 Pallet Selezionato\n\nDimensioni: ${dimensions}\nPeso: ${weight}\nMagazzino: ${warehouse}`);
        }
    } else {
        selectedPallet = null;
    }
}

// Handle keyboard navigation
function onKeyDown(event) {
    if (!window.truckPositions || window.truckPositions.length === 0) return;
    
    const spacing = TRUCK_LENGTH + 5;
    
    switch(event.key) {
        case 'ArrowLeft':
            // Move camera to previous truck
            const currentX = controls.target.x;
            const currentIndex = window.truckPositions.findIndex(t => Math.abs(t.x - currentX) < spacing / 2);
            
            if (currentIndex > 0) {
                const prevTruck = window.truckPositions[currentIndex - 1];
                animateCameraTo(prevTruck.x);
            }
            break;
            
        case 'ArrowRight':
            // Move camera to next truck
            const currentX2 = controls.target.x;
            const currentIndex2 = window.truckPositions.findIndex(t => Math.abs(t.x - currentX2) < spacing / 2);
            
            if (currentIndex2 < window.truckPositions.length - 1) {
                const nextTruck = window.truckPositions[currentIndex2 + 1];
                animateCameraTo(nextTruck.x);
            }
            break;
            
        case 'Home':
            // Reset to overview
            const totalWidth = window.truckPositions.length * spacing;
            animateCameraTo(totalWidth / 2, true);
            break;
    }
}

// Animate camera to position
function animateCameraTo(targetX, isOverview = false) {
    const startY = camera.position.y;
    const startZ = camera.position.z;
    const targetY = isOverview ? 25 : 15;
    const targetZ = isOverview ? 30 : 20;
    
    const duration = 500;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function
        const ease = t => t * (2 - t);
        const easedProgress = ease(progress);
        
        camera.position.x = targetX + 10;
        camera.position.y = startY + (targetY - startY) * easedProgress;
        camera.position.z = startZ + (targetZ - startZ) * easedProgress;
        
        controls.target.set(targetX, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Clear all objects from scene
function clearScene() {
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.isMesh || child.isLineSegments) {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    
    truckMeshes = [];
    palletMeshes = [];
}

// Draw a truck bed at a specific position
function drawTruckBed(positionX, offsetY, label, linearMeters) {
    const group = new THREE.Group();
    
    // Truck bed (wireframe)
    const geometry = new THREE.BoxGeometry(TRUCK_LENGTH, TRUCK_HEIGHT, TRUCK_WIDTH);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const truckMesh = new THREE.LineSegments(edges, material);
    truckMesh.position.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
    group.add(truckMesh);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(TRUCK_LENGTH, TRUCK_WIDTH);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x374151, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(TRUCK_LENGTH / 2, 0, TRUCK_WIDTH / 2);
    group.add(floor);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(TRUCK_LENGTH, 20, 0x4b5563, 0x4b5563);
    gridHelper.position.set(TRUCK_LENGTH / 2, 0, TRUCK_WIDTH / 2);
    group.add(gridHelper);
    
    // Add warehouse label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(label, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT + 1, TRUCK_WIDTH / 2);
    sprite.scale.set(4, 1, 1);
    group.add(sprite);
    
    // Add linear meters label
    const linearCanvas = document.createElement('canvas');
    const linearContext = linearCanvas.getContext('2d');
    linearCanvas.width = 256;
    linearCanvas.height = 64;
    linearContext.fillStyle = 'rgba(255, 255, 255, 0.9)';
    linearContext.fillRect(0, 0, 256, 64);
    linearContext.fillStyle = '#10b981';
    linearContext.font = 'bold 28px Arial';
    linearContext.textAlign = 'center';
    linearContext.fillText(`📏 ${linearMeters.toFixed(1)}m lineari`, 128, 40);
    
    const linearTexture = new THREE.CanvasTexture(linearCanvas);
    const linearSpriteMaterial = new THREE.SpriteMaterial({ map: linearTexture });
    const linearSprite = new THREE.Sprite(linearSpriteMaterial);
    linearSprite.position.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT + 2.5, TRUCK_WIDTH / 2);
    linearSprite.scale.set(4, 1, 1);
    group.add(linearSprite);
    
    group.position.set(positionX, offsetY, 0);
    scene.add(group);
    truckMeshes.push(group);
    
    return group;
}

// Draw a pallet without dimensions label
function drawPallet(pallet, index, offset) {
    const geometry = new THREE.BoxGeometry(
        pallet.rotated ? pallet.width : pallet.length,
        pallet.height,
        pallet.rotated ? pallet.length : pallet.width
    );
    
    const color = getColorForPallet(pallet.length, pallet.width, pallet.height);
    
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        offset.x + pallet.x + (pallet.rotated ? pallet.width : pallet.length) / 2,
        offset.y + pallet.z + pallet.height / 2,
        pallet.y + (pallet.rotated ? pallet.length : pallet.width) / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Store pallet data for click detection
    mesh.userData = {
        length: pallet.length,
        width: pallet.width,
        height: pallet.height,
        weight: pallet.weight,
        totalWeight: pallet.totalWeight || pallet.weight,
        warehouseName: pallet.warehouseName
    };
    
    scene.add(mesh);
    palletMeshes.push(mesh);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);
    edgeMesh.position.copy(mesh.position);
    scene.add(edgeMesh);
    palletMeshes.push(edgeMesh);
}

// Main optimization and visualization function
function optimizeAndVisualize() {
    const palletData = collectAllPalletData();
    
    if (palletData.length === 0) {
        alert('Inserisci almeno un pallet valido');
        return;
    }
    
    // Clear combinations view
    window.combinations = null;
    
    // Show loading indicator
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    resultsDiv.classList.remove('hidden');
    resultsContent.innerHTML = '<p class="text-yellow-300">⏳ Ottimizzazione in corso...</p>';
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            // Clear previous visualization
            clearScene();
            
            // Group pallets by warehouse
            const palletsByWarehouse = {};
            palletData.forEach(p => {
                if (!palletsByWarehouse[p.warehouseId]) {
                    palletsByWarehouse[p.warehouseId] = [];
                }
                palletsByWarehouse[p.warehouseId].push(p);
            });
            
            // Draw each warehouse on a separate truck
            let offsetX = 0;
            const spacing = TRUCK_LENGTH + 5;
            
            Object.keys(palletsByWarehouse).forEach((warehouseId, index) => {
                const warehousePallets = palletsByWarehouse[warehouseId];
                const warehouseName = warehouses.find(w => w.id === parseInt(warehouseId))?.name || `M${warehouseId}`;
                
                // Draw truck bed
                const truckOffset = { x: offsetX, y: 0 };
                
                // Run packing algorithm for this warehouse
                const { placedPallets, unplacedPallets } = packPallets(warehousePallets);
                
                // Calculate linear meters occupied
                let maxLinearMeter = 0;
                placedPallets.forEach(p => {
                    const endPosition = p.x + (p.rotated ? p.width : p.length);
                    if (endPosition > maxLinearMeter) {
                        maxLinearMeter = endPosition;
                    }
                });
                
                drawTruckBed(offsetX, 0, `🏭 ${warehouseName}`, maxLinearMeter);
                
                // Draw placed pallets
                placedPallets.forEach((pallet, i) => {
                    drawPallet(pallet, i, truckOffset);
                });
                
                offsetX += spacing;
            });
            
            // Adjust camera to see all trucks
            const numTrucks = Object.keys(palletsByWarehouse).length;
            const totalWidth = numTrucks * spacing;
            
            // Better camera positioning for multiple trucks
            camera.position.set(totalWidth / 2, 25, 30);
            controls.target.set(totalWidth / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
            controls.update();
            
            // Store truck positions for quick navigation
            window.truckPositions = [];
            Object.keys(palletsByWarehouse).forEach((warehouseId, index) => {
                window.truckPositions.push({
                    x: index * spacing + TRUCK_LENGTH / 2,
                    name: warehouses.find(w => w.id === parseInt(warehouseId))?.name || `M${warehouseId}`
                });
            });
            
            // Display results
            displayResults(palletData);
        } catch (error) {
            console.error('Error optimizing:', error);
            resultsContent.innerHTML = '<p class="text-red-300">Errore nell\'ottimizzazione.</p>';
        }
    }, 10);
}

// Display results
function displayResults(palletData) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorsDiv = document.getElementById('errors');
    const errorsContent = document.getElementById('errorsContent');
    
    resultsDiv.classList.remove('hidden');
    errorsDiv.classList.add('hidden');
    
    // Check if this is a combination (no warehouse grouping)
    const hasWarehouses = palletData.some(p => p.warehouseName);
    
    if (!hasWarehouses) {
        // Single combined truck view
        const totalWeight = palletData.reduce((sum, p) => sum + p.weight, 0);
        const totalVolume = palletData.reduce((sum, p) => sum + p.length * p.width * p.height, 0);
        
        resultsContent.innerHTML = `
            <p><strong>Totale combinato:</strong> ${palletData.length} pallet, ${(totalWeight / 1000).toFixed(2)}t, ${totalVolume.toFixed(2)}m³</p>
        `;
        return;
    }
    
    // Group by warehouse
    const byWarehouse = {};
    palletData.forEach(p => {
        if (!byWarehouse[p.warehouseName]) {
            byWarehouse[p.warehouseName] = [];
        }
        byWarehouse[p.warehouseName].push(p);
    });
    
    let resultsHTML = '';
    Object.keys(byWarehouse).forEach(warehouseName => {
        const pallets = byWarehouse[warehouseName];
        
        // Use totalWeight to avoid double counting for multiple pallets of same type
        const uniqueRows = new Set();
        const totalWeight = pallets.reduce((sum, p) => {
            const rowKey = `${p.warehouseId}-${p.id.split('-')[1]}`;
            if (!uniqueRows.has(rowKey)) {
                uniqueRows.add(rowKey);
                return sum + (p.totalWeight || p.weight);
            }
            return sum;
        }, 0);
        
        const totalVolume = pallets.reduce((sum, p) => sum + p.length * p.width * p.height, 0);
        
        resultsHTML += `
            <p><strong>${warehouseName}:</strong> ${pallets.length} pallet, ${(totalWeight / 1000).toFixed(2)}t, ${totalVolume.toFixed(2)}m³</p>
        `;
    });
    
    resultsContent.innerHTML = resultsHTML;
}

// Generate combinations for optimal transport
async function generateCombinations() {
    const palletData = collectAllPalletData();
    
    if (palletData.length === 0) {
        alert('Inserisci almeno un pallet valido');
        return;
    }
    
    if (warehouses.length < 2) {
        alert('Devi avere almeno 2 magazzini per generare combinazioni');
        return;
    }
    
    // Clear scene immediately to free memory
    clearScene();
    window.combinations = null;
    previousMultiView = null;
    
    // Show loading indicator
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    resultsDiv.classList.remove('hidden');
    resultsContent.innerHTML = '<p class="text-yellow-300">⏳ Calcolo combinazioni in corso...</p>';
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
        try {
            // Group pallets by warehouse
            const palletsByWarehouse = {};
            palletData.forEach(p => {
                if (!palletsByWarehouse[p.warehouseId]) {
                    palletsByWarehouse[p.warehouseId] = [];
                }
                palletsByWarehouse[p.warehouseId].push(p);
            });
            
            const warehouseIds = Object.keys(palletsByWarehouse);
            const combinations = [];
            
            // First, try to fit all in one truck
            for (let size = warehouseIds.length; size >= 2; size--) {
                const combinationsOfSize = getCombinations(warehouseIds, size);
                
                // Limit combinations to try
                const maxCombinationsToTry = Math.min(combinationsOfSize.length, 5);
                
                for (let i = 0; i < maxCombinationsToTry; i++) {
                    const combination = combinationsOfSize[i];
                    
                    const combinedPallets = [];
                    combination.forEach(whId => {
                        palletsByWarehouse[whId].forEach(p => {
                            combinedPallets.push(p);
                        });
                    });
                    
                    const { placedPallets, unplacedPallets } = packPallets(combinedPallets, true);
                    
                    if (unplacedPallets.length === 0) {
                        const uniqueRows = new Set();
                        const totalWeight = combinedPallets.reduce((sum, p) => {
                            const rowKey = `${p.warehouseId}-${p.id.split('-')[1]}`;
                            if (!uniqueRows.has(rowKey)) {
                                uniqueRows.add(rowKey);
                                return sum + (p.totalWeight || p.weight);
                            }
                            return sum;
                        }, 0);
                        
                        const maxLinearMeter = placedPallets.reduce((max, p) => {
                            const endPosition = p.x + (p.rotated ? p.width : p.length);
                            return Math.max(max, endPosition);
                        }, 0);
                        
                        const warehouseNames = combination.map(id => 
                            warehouses.find(w => w.id === parseInt(id))?.name || `M${id}`
                        ).join(' + ');
                        
                        combinations.push({
                            type: 'single',
                            warehouses: warehouseNames,
                            numPallets: combinedPallets.length,
                            totalWeight: totalWeight,
                            linearMeters: maxLinearMeter,
                            savedTrucks: size - 1,
                            warehouseIds: combination
                        });
                        
                        if (size === warehouseIds.length) {
                            break;
                        }
                    }
                }
                
                if (combinations.length > 0) {
                    break;
                }
            }
            
            // If no single-truck combination found, try multi-truck options
            if (combinations.length === 0) {
                // Try pairing warehouses
                for (let i = 0; i < warehouseIds.length; i++) {
                    for (let j = i + 1; j < warehouseIds.length; j++) {
                        const wh1 = warehouseIds[i];
                        const wh2 = warehouseIds[j];
                        
                        // Try to fit both in one truck
                        const combinedPallets = [...palletsByWarehouse[wh1], ...palletsByWarehouse[wh2]];
                        const { placedPallets, unplacedPallets } = packPallets(combinedPallets, true);
                        
                        if (unplacedPallets.length === 0) {
                            const remainingWarehouses = warehouseIds.filter(id => id !== wh1 && id !== wh2);
                            
                            // Try to fit remaining in another truck
                            const remainingPallets = [];
                            remainingWarehouses.forEach(whId => {
                                palletsByWarehouse[whId].forEach(p => {
                                    remainingPallets.push(p);
                                });
                            });
                            
                            const { placedPallets: placedRemaining, unplacedPallets: unplacedRemaining } = packPallets(remainingPallets, true);
                            
                            if (unplacedRemaining.length === 0) {
                                // Both trucks work
                                const wh1Name = warehouses.find(w => w.id === parseInt(wh1))?.name || `M${wh1}`;
                                const wh2Name = warehouses.find(w => w.id === parseInt(wh2))?.name || `M${wh2}`;
                                const remainingNames = remainingWarehouses.map(id => 
                                    warehouses.find(w => w.id === parseInt(id))?.name || `M${id}`
                                ).join(' + ');
                                
                                combinations.push({
                                    type: 'multi',
                                    truck1: `${wh1Name} + ${wh2Name}`,
                                    truck2: remainingNames,
                                    numTrucks: 2,
                                    totalPallets: combinedPallets.length + remainingPallets.length
                                });
                            }
                        }
                    }
                }
            }
            
            // Display results
            displayCombinations(combinations);
        } catch (error) {
            console.error('Error generating combinations:', error);
            resultsContent.innerHTML = '<p class="text-red-300">Errore nel calcolo delle combinazioni.</p>';
        }
    }, 10);
}

// Get all combinations of size k from array
function getCombinations(arr, k) {
    const result = [];
    
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return result;
}

// Display combination results
function displayCombinations(combinations) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorsDiv = document.getElementById('errors');
    const errorsContent = document.getElementById('errorsContent');
    
    resultsDiv.classList.remove('hidden');
    errorsDiv.classList.add('hidden');
    
    if (combinations.length === 0) {
        resultsContent.innerHTML = `
            <p>Nessuna combinazione valida trovata.</p>
            <p class="text-sm mt-2">I magazzini non possono essere combinati in modo efficiente.</p>
        `;
        return;
    }
    
    let html = '<p class="font-semibold mb-3">Combinazioni ottimali trovate:</p>';
    
    combinations.forEach((combo, index) => {
        const isSelected = index === 0 ? 'border-green-500' : 'border-white/20';
        
        if (combo.type === 'single') {
            html += `
                <div class="bg-white/10 rounded-lg p-3 mb-2 cursor-pointer hover:bg-white/20 transition border ${isSelected}" onclick="visualizeCombination(${index})">
                    <p class="font-semibold text-green-300">💡 Opzione ${index + 1} (clicca per visualizzare)</p>
                    <p><strong>🚚 Mezzo unico:</strong> ${combo.warehouses}</p>
                    <p><strong>Pallet totali:</strong> ${combo.numPallets}</p>
                    <p><strong>Peso:</strong> ${(combo.totalWeight / 1000).toFixed(2)}t</p>
                    <p><strong>Metri lineari:</strong> ${combo.linearMeters.toFixed(1)}m</p>
                    <p class="text-green-300"><strong>Risparmio:</strong> ${combo.savedTrucks} trasporto/i</p>
                </div>
            `;
        } else {
            html += `
                <div class="bg-white/10 rounded-lg p-3 mb-2 cursor-pointer hover:bg-white/20 transition border ${isSelected}" onclick="visualizeCombination(${index})">
                    <p class="font-semibold text-blue-300">🚚 Opzione ${index + 1} (clicca per visualizzare)</p>
                    <p><strong>🚚 Mezzo 1:</strong> ${combo.truck1}</p>
                    <p><strong>🚚 Mezzo 2:</strong> ${combo.truck2}</p>
                    <p><strong>Numero mezzi:</strong> ${combo.numTrucks}</p>
                    <p><strong>Pallet totali:</strong> ${combo.totalPallets}</p>
                </div>
            `;
        }
    });
    
    resultsContent.innerHTML = html;
    
    // Store combinations for visualization
    window.combinations = combinations;
}

// Visualize a specific combination
function visualizeCombination(index) {
    const combo = window.combinations[index];
    if (!combo) return;
    
    // Store current multi-view state before switching
    if (!previousMultiView) {
        previousMultiView = {
            palletData: collectAllPalletData(),
            truckPositions: window.truckPositions ? [...window.truckPositions] : null
        };
    }
    
    // Clear previous visualization
    clearScene();
    
    const palletData = collectAllPalletData();
    
    if (combo.type === 'single') {
        // Single truck visualization
        const warehouseNames = combo.warehouses.split(' + ');
        const warehouseIds = warehouseNames.map(name => {
            const warehouse = warehouses.find(w => w.name === name);
            return warehouse ? warehouse.id : null;
        }).filter(id => id !== null);
        
        const combinedPallets = [];
        warehouseIds.forEach(whId => {
            const warehousePallets = palletData.filter(p => p.warehouseId === whId);
            combinedPallets.push(...warehousePallets);
        });
        
        const { placedPallets } = packPallets(combinedPallets, true);
        
        let maxLinearMeter = 0;
        placedPallets.forEach(p => {
            const endPosition = p.x + (p.rotated ? p.width : p.length);
            if (endPosition > maxLinearMeter) {
                maxLinearMeter = endPosition;
            }
        });
        
        drawTruckBed(0, 0, `🚚 ${combo.warehouses}`, maxLinearMeter);
        
        const truckOffset = { x: 0, y: 0 };
        placedPallets.forEach((pallet, i) => {
            drawPallet(pallet, i, truckOffset);
        });
        
        camera.position.set(TRUCK_LENGTH / 2 + 10, 15, 20);
        controls.target.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
        controls.update();
        
        const resultsDiv = document.getElementById('results');
        const resultsContent = document.getElementById('resultsContent');
        const currentContent = resultsContent.innerHTML;
        resultsContent.innerHTML = `
            <div class="bg-green-500/20 rounded-lg p-3 mb-3 border border-green-500/30">
                <p class="text-green-300 font-semibold">✅ Visualizzazione: ${combo.warehouses}</p>
                <p class="text-green-200 text-sm">Metri lineari: ${maxLinearMeter.toFixed(1)}m | Pallet: ${placedPallets.length}/${combinedPallets.length}</p>
            </div>
            ${currentContent}
        `;
        
        window.truckPositions = [{
            x: TRUCK_LENGTH / 2,
            name: combo.warehouses
        }];
    } else {
        // Multi-truck visualization (show first truck only for now)
        const truck1Names = combo.truck1.split(' + ');
        const truck1Ids = truck1Names.map(name => {
            const warehouse = warehouses.find(w => w.name === name);
            return warehouse ? warehouse.id : null;
        }).filter(id => id !== null);
        
        const truck1Pallets = [];
        truck1Ids.forEach(whId => {
            const warehousePallets = palletData.filter(p => p.warehouseId === whId);
            truck1Pallets.push(...warehousePallets);
        });
        
        const { placedPallets } = packPallets(truck1Pallets, true);
        
        let maxLinearMeter = 0;
        placedPallets.forEach(p => {
            const endPosition = p.x + (p.rotated ? p.width : p.length);
            if (endPosition > maxLinearMeter) {
                maxLinearMeter = endPosition;
            }
        });
        
        drawTruckBed(0, 0, `🚚 ${combo.truck1}`, maxLinearMeter);
        
        const truckOffset = { x: 0, y: 0 };
        placedPallets.forEach((pallet, i) => {
            drawPallet(pallet, i, truckOffset);
        });
        
        camera.position.set(TRUCK_LENGTH / 2 + 10, 15, 20);
        controls.target.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
        controls.update();
        
        const resultsDiv = document.getElementById('results');
        const resultsContent = document.getElementById('resultsContent');
        const currentContent = resultsContent.innerHTML;
        resultsContent.innerHTML = `
            <div class="bg-blue-500/20 rounded-lg p-3 mb-3 border border-blue-500/30">
                <p class="text-blue-300 font-semibold">✅ Visualizzazione: Mezzo 1 - ${combo.truck1}</p>
                <p class="text-blue-200 text-sm">Metri lineari: ${maxLinearMeter.toFixed(1)}m | Pallet: ${placedPallets.length}/${truck1Pallets.length}</p>
                <p class="text-blue-200 text-sm mt-1">Mezzo 2: ${combo.truck2} (non visualizzato)</p>
            </div>
            ${currentContent}
        `;
        
        window.truckPositions = [{
            x: TRUCK_LENGTH / 2,
            name: combo.truck1
        }];
    }
    
    document.getElementById('returnToMultiBtn').classList.remove('hidden');
}

// Return to multi-warehouse view
function returnToMultiView() {
    if (!previousMultiView) return;
    
    // Restore multi-view
    clearScene();
    
    const palletData = previousMultiView.palletData;
    
    // Group pallets by warehouse
    const palletsByWarehouse = {};
    palletData.forEach(p => {
        if (!palletsByWarehouse[p.warehouseId]) {
            palletsByWarehouse[p.warehouseId] = [];
        }
        palletsByWarehouse[p.warehouseId].push(p);
    });
    
    // Draw each warehouse on a separate truck
    let offsetX = 0;
    const spacing = TRUCK_LENGTH + 5;
    
    Object.keys(palletsByWarehouse).forEach((warehouseId, index) => {
        const warehousePallets = palletsByWarehouse[warehouseId];
        const warehouseName = warehouses.find(w => w.id === parseInt(warehouseId))?.name || `M${warehouseId}`;
        
        const truckOffset = { x: offsetX, y: 0 };
        const { placedPallets } = packPallets(warehousePallets);
        
        let maxLinearMeter = 0;
        placedPallets.forEach(p => {
            const endPosition = p.x + (p.rotated ? p.width : p.length);
            if (endPosition > maxLinearMeter) {
                maxLinearMeter = endPosition;
            }
        });
        
        drawTruckBed(offsetX, 0, `🏭 ${warehouseName}`, maxLinearMeter);
        
        placedPallets.forEach((pallet, i) => {
            drawPallet(pallet, i, truckOffset);
        });
        
        offsetX += spacing;
    });
    
    // Adjust camera
    const numTrucks = Object.keys(palletsByWarehouse).length;
    const totalWidth = numTrucks * spacing;
    camera.position.set(totalWidth / 2, 25, 30);
    controls.target.set(totalWidth / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
    controls.update();
    
    window.truckPositions = previousMultiView.truckPositions;
    
    // Display results
    displayResults(palletData);
    
    // Hide return button
    document.getElementById('returnToMultiBtn').classList.add('hidden');
    
    // Clear stored state
    previousMultiView = null;
}
