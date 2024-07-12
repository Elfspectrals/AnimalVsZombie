const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let plants = [];
let enemies = [];
let plantSlots = [];
let path;
let graphics;
let currentPlant = null;

function preload() {
    this.load.image('peaShooter', './placeholder.png');
    this.load.image('sunFlower', './placeholder2.png');
    this.load.image('enemy', './ship2.png');
}

function create() {
    graphics = this.add.graphics();

    const generateSlot = (positionX, positionY, gapBetweenSlot, slotSize, colorSlot) => {
        for (let i = 0; i < 5; i++) {
            let slot = this.add.rectangle(positionX, positionY + i * gapBetweenSlot, slotSize, slotSize, colorSlot);
            slot.setStrokeStyle(2, 0xffffff);
            slot.plant = null; // Add a plant property to track the plant in the slot
            plantSlots.push(slot);
        }
    };
    generateSlot(50, 100, 100, 50, 0x00ff00);

    class PlantCreator {
        constructor(scene, positionX, positionY, typePlant) {
            this.scene = scene;
            this.positionX = positionX;
            this.positionY = positionY;
            this.typePlant = typePlant;
            this.createPlant();
        }

        createPlant() {
            let plant = this.scene.add.image(this.positionX, this.positionY, this.typePlant).setInteractive();
            plant.setScale(0.1);
            plant.currentSlot = null; // Keep track of the slot where the plant is placed

            plant.on('pointerdown', (pointer) => {
                let newPlant = this.scene.add.image(plant.x, plant.y, this.typePlant).setInteractive();
                newPlant.setScale(0.1);
                newPlant.currentSlot = null; // Keep track of the slot where the new plant is placed
                this.scene.input.setDraggable(newPlant);

                newPlant.on('dragstart', (pointer, dragX, dragY) => {
                    currentPlant = newPlant;
                    // If the plant was in a slot, free the slot
                    if (newPlant.currentSlot) {
                        newPlant.currentSlot.plant = null;
                        newPlant.currentSlot = null;
                    }
                });

                newPlant.on('drag', (pointer, dragX, dragY) => {
                    newPlant.x = dragX;
                    newPlant.y = dragY;
                });

                newPlant.on('dragend', (pointer) => {
                    if (isOnSlot(newPlant)) {
                        console.log('Plant placed on a valid slot');
                    } else {
                        // Destroy the new plant if not placed on a valid slot
                        newPlant.destroy();
                    }
                    currentPlant = null;
                });
            });
        }
    }

    new PlantCreator(this, 800, 50, 'peaShooter');
    new PlantCreator(this, 900, 50, 'sunFlower');
}

function isOnSlot(plant) {
    for (let slot of plantSlots) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(plant.getBounds(), slot.getBounds())) {
            if (slot.plant === null) {
                // If slot is empty, place the plant
                plant.x = slot.x;
                plant.y = slot.y;
                slot.plant = plant; // Mark the slot as occupied
                plant.currentSlot = slot; // Track the slot in the plant
                return true;
            } else {
                // If slot is occupied, do not place the plant
                return false;
            }
        }
    }
    return false;
}

function update() {
    // Game logic updates
}
