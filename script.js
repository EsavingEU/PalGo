// Global variables
let pallets = [];
let scene, camera, renderer, controls;
let truckMesh;

// Bilico dimensions (in meters)
const TRUCK_LENGTH = 13.6;
const TRUCK_WIDTH = 2.5;
const TRUCK_HEIGHT = 2.6;
const MAX_WEIGHT = 25000; // 25 tons in kg

// Initialize with one pallet row
document.addEventListener('DOMContentLoaded', function() {
    addPalletRow();
    initThreeJS();
});

// Add a new pallet row
function addPalletRow() {
    const form = document.getElementById('palletForm');
    const rowIndex = pallets.length;
    
    const row = document.createElement('div');
    row.className = 'pallet-row';
    row.id = `pallet-${rowIndex}`;
    row.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <span class="text-white font-semibold">Pallet #${rowIndex + 1}</span>
            <button onclick="removePalletRow(${rowIndex})" class="remove-btn">Rimuovi</button>
        </div>
        <div class="input-group">
            <div>
                <div class="input-label">Quantità</div>
                <input type="number" id="quantity-${rowIndex}" placeholder="1" step="1" min="1" value="1">
            </div>
            <div>
                <div class="input-label">Lunghezza (m)</div>
                <input type="number" id="length-${rowIndex}" placeholder="1.2" step="0.01" min="0.1" value="1.2">
            </div>
            <div>
                <div class="input-label">Larghezza (m)</div>
                <input type="number" id="width-${rowIndex}" placeholder="0.8" step="0.01" min="0.1" value="0.8">
            </div>
            <div>
                <div class="input-label">Altezza (m)</div>
                <input type="number" id="height-${rowIndex}" placeholder="1.5" step="0.01" min="0.1" value="1.5">
            </div>
            <div>
                <div class="input-label">Peso (kg)</div>
                <input type="number" id="weight-${rowIndex}" placeholder="500" step="1" min="1" value="500">
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="stackable-${rowIndex}" checked>
                <label for="stackable-${rowIndex}">Sovrapponibile</label>
            </div>
        </div>
    `;
    
    form.appendChild(row);
    pallets.push({ id: rowIndex });
}

// Remove a pallet row
function removePalletRow(index) {
    const row = document.getElementById(`pallet-${index}`);
    if (row) {
        row.remove();
        pallets = pallets.filter(p => p.id !== index);
        // Re-index remaining rows
        document.querySelectorAll('.pallet-row').forEach((row, i) => {
            row.querySelector('span').textContent = `Pallet #${i + 1}`;
            row.querySelector('.remove-btn').onclick = () => removePalletRow(i);
        });
    }
}

// Collect pallet data from form
function collectPalletData() {
    const data = [];
    const rows = document.querySelectorAll('.pallet-row');
    
    rows.forEach((row, index) => {
        const quantity = parseInt(document.getElementById(`quantity-${index}`).value) || 1;
        const length = parseFloat(document.getElementById(`length-${index}`).value) || 0;
        const width = parseFloat(document.getElementById(`width-${index}`).value) || 0;
        const height = parseFloat(document.getElementById(`height-${index}`).value) || 0;
        const weight = parseFloat(document.getElementById(`weight-${index}`).value) || 0;
        const stackable = document.getElementById(`stackable-${index}`).checked;
        
        if (length > 0 && width > 0 && height > 0 && weight > 0 && quantity > 0) {
            // Add multiple copies of the same pallet
            for (let i = 0; i < quantity; i++) {
                data.push({
                    id: `${index}-${i}`,
                    originalRow: index,
                    length,
                    width,
                    height,
                    weight,
                    stackable
                });
            }
        }
    });
    
    return data;
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
    camera.position.set(15, 10, 15);
    
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
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Draw truck bed
    drawTruckBed();
    
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

// Draw truck bed
function drawTruckBed() {
    // Truck bed (wireframe)
    const geometry = new THREE.BoxGeometry(TRUCK_LENGTH, TRUCK_HEIGHT, TRUCK_WIDTH);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    truckMesh = new THREE.LineSegments(edges, material);
    truckMesh.position.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
    scene.add(truckMesh);
    
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
    scene.add(floor);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(TRUCK_LENGTH, 20, 0x4b5563, 0x4b5563);
    gridHelper.position.set(TRUCK_LENGTH / 2, 0, TRUCK_WIDTH / 2);
    scene.add(gridHelper);
}

// Clear pallets from scene
function clearPallets() {
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.isMesh && child !== truckMesh) {
            objectsToRemove.push(child);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
}

// Draw a pallet
function drawPallet(pallet, index) {
    const geometry = new THREE.BoxGeometry(
        pallet.rotated ? pallet.width : pallet.length,
        pallet.height,
        pallet.rotated ? pallet.length : pallet.width
    );
    
    // Generate a color based on index
    const hue = (index * 0.1) % 1;
    const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
    
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        pallet.x + (pallet.rotated ? pallet.width : pallet.length) / 2,
        pallet.z + pallet.height / 2,
        pallet.y + (pallet.rotated ? pallet.length : pallet.width) / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    scene.add(mesh);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);
    edgeMesh.position.copy(mesh.position);
    scene.add(edgeMesh);
}

// Main optimization and visualization function
function optimizeAndVisualize() {
    const palletData = collectPalletData();
    
    if (palletData.length === 0) {
        alert('Inserisci almeno un pallet valido');
        return;
    }
    
    // Run packing algorithm
    const { placedPallets, unplacedPallets } = packPallets(palletData);
    
    // Clear previous visualization
    clearPallets();
    
    // Draw placed pallets
    placedPallets.forEach((pallet, index) => {
        drawPallet(pallet, index);
    });
    
    // Calculate totals
    const totalWeight = placedPallets.reduce((sum, p) => sum + p.weight, 0);
    const maxPlacedHeight = placedPallets.reduce((max, p) => Math.max(max, p.z + p.height), 0);
    
    // Display results
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const errorsDiv = document.getElementById('errors');
    const errorsContent = document.getElementById('errorsContent');
    
    resultsDiv.classList.remove('hidden');
    errorsDiv.classList.add('hidden');
    
    let resultsHTML = `
        <p><strong>Pallet posizionati:</strong> ${placedPallets.length} / ${palletData.length}</p>
        <p><strong>Peso totale:</strong> ${(totalWeight / 1000).toFixed(2)}t / 25t</p>
        <p><strong>Altezza massima:</strong> ${maxPlacedHeight.toFixed(2)}m / 2.60m</p>
        <p><strong>Volume occupato:</strong> ${placedPallets.reduce((sum, p) => sum + p.length * p.width * p.height, 0).toFixed(2)}m³</p>
    `;
    
    resultsContent.innerHTML = resultsHTML;
    
    // Check for issues
    const issues = [];
    
    if (totalWeight > MAX_WEIGHT) {
        issues.push(`⚠️ Peso eccessivo: ${(totalWeight / 1000).toFixed(2)}t (max 25t)`);
    }
    
    if (maxPlacedHeight > TRUCK_HEIGHT) {
        issues.push(`⚠️ Altezza eccessiva: ${maxPlacedHeight.toFixed(2)}m (max 2.60m)`);
    }
    
    if (unplacedPallets.length > 0) {
        // Group unplaced pallets by original row
        const unplacedGroups = {};
        unplacedPallets.forEach(p => {
            const key = `${p.length}x${p.width}x${p.height}`;
            if (!unplacedGroups[key]) {
                unplacedGroups[key] = { count: 0, ...p };
            }
            unplacedGroups[key].count++;
        });
        
        issues.push(`⚠️ ${unplacedPallets.length} pallet non ci stanno:`);
        Object.values(unplacedGroups).forEach(group => {
            issues.push(`   - ${group.count} pallet: ${group.length}m × ${group.width}m × ${group.height}m (${group.weight}kg)`);
        });
    }
    
    if (issues.length > 0) {
        errorsDiv.classList.remove('hidden');
        errorsContent.innerHTML = issues.join('<br>');
    }
    
    // Reset camera to good viewing position
    camera.position.set(15, 10, 15);
    controls.target.set(TRUCK_LENGTH / 2, TRUCK_HEIGHT / 2, TRUCK_WIDTH / 2);
    controls.update();
}
