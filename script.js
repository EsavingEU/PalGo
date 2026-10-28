// Global variables
let warehouses = [];
let scene, camera, renderer, controls;
let truckMeshes = [];
let palletMeshes = [];

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
                for (let i = 0; i < quantity; i++) {
                    data.push({
                        id: `${warehouse.id}-${rowIndex}-${i}`,
                        warehouseId: warehouse.id,
                        warehouseName: warehouse.name,
                        length,
                        width,
                        height,
                        weight,
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
function packPallets(palletData) {
    // Sort pallets by base area (larger first) for better packing
    const sortedPallets = [...palletData].sort((a, b) => {
        const areaA = a.length * a.width;
        const areaB = b.length * b.width;
        return areaB - areaA;
    });
    
    const placedPallets = [];
    const unplacedPallets = [];
    
    // Create a 3D grid representation of the truck
    const cellSize = 0.05; // 5cm resolution
    const gridLength = Math.ceil(TRUCK_LENGTH / cellSize);
    const gridWidth = Math.ceil(TRUCK_WIDTH / cellSize);
    const gridHeight = Math.ceil(TRUCK_HEIGHT / cellSize);
    
    // 3D array to track occupied space
    const occupied = Array(gridHeight).fill(null).map(() => 
        Array(gridWidth).fill(null).map(() => 
            Array(gridLength).fill(false)
        )
    );
    
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
    }
    
    // Try to place each pallet
    for (const pallet of sortedPallets) {
        let placed = false;
        
        // Try both orientations
        for (const rotated of [false, true]) {
            if (placed) break;
            
            // Try to place at the bottom (z=0) first
            if (pallet.stackable || !placed) {
                for (let x = 0; x <= TRUCK_LENGTH - (rotated ? pallet.width : pallet.length); x += cellSize) {
                    if (placed) break;
                    for (let y = 0; y <= TRUCK_WIDTH - (rotated ? pallet.length : pallet.width); y += cellSize) {
                        if (canPlace(pallet, x, y, 0, rotated)) {
                            markOccupied(pallet, x, y, 0, rotated);
                            placedPallets.push({
                                ...pallet,
                                x,
                                y,
                                z: 0,
                                rotated
                            });
                            placed = true;
                            break;
                        }
                    }
                }
            }
            
            // If stackable, try to place on top of other pallets
            if (pallet.stackable && !placed) {
                for (const placedPallet of placedPallets) {
                    if (placed) break;
                    const topZ = placedPallet.z + placedPallet.height;
                    
                    for (let x = placedPallet.x; x <= placedPallet.x + (placedPallet.rotated ? placedPallet.width : placedPallet.length) - (rotated ? pallet.width : pallet.length); x += cellSize) {
                        if (placed) break;
                        for (let y = placedPallet.y; y <= placedPallet.y + (placedPallet.rotated ? placedPallet.length : placedPallet.width) - (rotated ? pallet.length : pallet.width); y += cellSize) {
                            if (canPlace(pallet, x, y, topZ, rotated)) {
                                markOccupied(pallet, x, y, topZ, rotated);
                                placedPallets.push({
                                    ...pallet,
                                    x,
                                    y,
                                    z: topZ,
                                    rotated
                                });
                                placed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        if (!placed) {
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
function drawTruckBed(positionX, offsetY, label) {
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
    
    // Add label
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
    
    group.position.set(positionX, offsetY, 0);
    scene.add(group);
    truckMeshes.push(group);
    
    return group;
}

// Draw a pallet with dimensions label
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
    scene.add(mesh);
    palletMeshes.push(mesh);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);
    edgeMesh.position.copy(mesh.position);
    scene.add(edgeMesh);
    palletMeshes.push(edgeMesh);
    
    // Add dimensions label
    const dimensions = `${(pallet.rotated ? pallet.width : pallet.length).toFixed(1)}×${(pallet.rotated ? pallet.length : pallet.width).toFixed(1)}×${pallet.height.toFixed(1)}`;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillRect(0, 0, 128, 64);
    context.fillStyle = 'white';
    context.font = 'bold 14px Arial';
    context.textAlign = 'center';
    context.fillText(dimensions, 64, 36);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(
        mesh.position.x,
        mesh.position.y + pallet.height / 2 + 0.3,
        mesh.position.z
    );
    sprite.scale.set(2, 1, 1);
    scene.add(sprite);
    palletMeshes.push(sprite);
}

// Main optimization and visualization function
function optimizeAndVisualize() {
    const palletData = collectAllPalletData();
    
    if (palletData.length === 0) {
        alert('Inserisci almeno un pallet valido');
        return;
    }
    
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
        drawTruckBed(offsetX, 0, `🏭 ${warehouseName}`);
        
        // Run packing algorithm for this warehouse
        const { placedPallets, unplacedPallets } = packPallets(warehousePallets);
        
        // Draw placed pallets
        placedPallets.forEach((pallet, i) => {
            drawPallet(pallet, i, truckOffset);
        });
        
        offsetX += spacing;
    });
    
    // Adjust camera to see all trucks
    const totalWidth = Object.keys(palletsByWarehouse).length * spacing;
    camera.position.set(totalWidth / 2 + 10, 15, 20);
    controls.target.set(totalWidth / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
    controls.update();
    
    // Display results
    displayResults(palletData);
}

// Display results
function displayResults(palletData) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorsDiv = document.getElementById('errors');
    const errorsContent = document.getElementById('errorsContent');
    
    resultsDiv.classList.remove('hidden');
    errorsDiv.classList.add('hidden');
    
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
        const totalWeight = pallets.reduce((sum, p) => sum + p.weight, 0);
        const totalVolume = pallets.reduce((sum, p) => sum + p.length * p.width * p.height, 0);
        
        resultsHTML += `
            <p><strong>${warehouseName}:</strong> ${pallets.length} pallet, ${(totalWeight / 1000).toFixed(2)}t, ${totalVolume.toFixed(2)}m³</p>
        `;
    });
    
    resultsContent.innerHTML = resultsHTML;
}

// Generate combinations (placeholder for now)
function generateCombinations() {
    alert('Funzione di generazione combinazioni in sviluppo...');
}
