class Scene1 extends Phaser.Scene {
    constructor() {
        super('Scene1');
        this.plants = [];
        this.enemies = [];
        this.plantSlots = [];
        this.path = null;
        this.graphics = null;
        this.currentPlant = null;
        this.canShootAgain = true;
        this.fireballs = []; // Initialize fireballs array
    }

    preload() {
        this.load.image('peaShooter', './assets/placeholder.png');
        this.load.image('sunFlower', './assets/placeholder2.png');
        this.load.image('enemy', './assets/placeholder.png');
        this.load.image('projectile', './assets/fireball.png');
    }
    
    create() {
        this.graphics = this.add.graphics();
    
        const generateSlot = (positionX, positionY, gapBetweenSlot, slotSize, colorSlot) => {
            for (let i = 0; i < 5; i++) {
                let slot = this.add.rectangle(positionX, positionY + i * gapBetweenSlot, slotSize, slotSize, colorSlot);
                slot.setStrokeStyle(2, 0xffffff);
                slot.plant = null; // Add a plant property to track the plant in the slot
                this.plantSlots.push(slot);
            }
        };
        generateSlot(50, 100, 100, 50, 0x00ff00);
    
        this.createPlant = (positionX, positionY, typePlant) => {
            let plant = this.add.image(positionX, positionY, typePlant).setInteractive();
            plant.setScale(0.1);
            plant.currentSlot = null; // Keep track of the slot where the plant is placed
            this.plants.push(plant); // Add plant to the plants array
    
            plant.on('pointerdown', () => {
                let newPlant = this.add.image(plant.x, plant.y, typePlant).setInteractive();
                newPlant.setScale(0.1);
                newPlant.currentSlot = null; // Keep track of the slot where the new plant is placed
                this.input.setDraggable(newPlant);
                this.plants.push(newPlant); // Add newPlant to the plants array
    
                newPlant.on('dragstart', () => {
                    this.currentPlant = newPlant;
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
    
                newPlant.on('dragend', () => {
                    if (this.isOnSlot(newPlant)) {
                        console.log('Plant placed on a valid slot');
                    } else {
                        // Remove newPlant from the plants array if not placed on a valid slot
                        const index = this.plants.indexOf(newPlant);
                        if (index > -1) {
                            this.plants.splice(index, 1);
                        }
                        newPlant.destroy();
                    }
                    this.currentPlant = null;
                });
            });
        };
    
        this.createPlant(800, 50, 'peaShooter');
        this.createPlant(900, 50, 'sunFlower');
    
        // Step 2: Create an initial enemy for demonstration
        this.createEnemy(); // Adjust the Y position based on your game's slot positions
    }
    
    isOnSlot(plant) {
        let placed = false;
        this.plantSlots.forEach(slot => {
            if (Phaser.Geom.Rectangle.Overlaps(slot.getBounds(), plant.getBounds())) {
                if (!slot.plant) { // Check if the slot is empty
                    slot.plant = plant; // Assign the plant to the slot
                    plant.currentSlot = slot; // Mark the slot as occupied by the plant
                    plant.x = slot.x; // Adjust the plant's position to align with the slot
                    plant.y = slot.y;
                    placed = true;
                }
            }
        });
        return placed;
    }
    
    createEnemy() {
        if (this.plantSlots.length > 0) {
            let randomSlotIndex = Phaser.Math.Between(0, this.plantSlots.length - 1);
            let targetSlot = this.plantSlots[randomSlotIndex];
    
            let enemy = this.add.image(1200, targetSlot.y, 'enemy').setInteractive(); 
            enemy.setScale(0.1);
            enemy.flipX = true;
            this.enemies.push(enemy);
        }
    }
    
    shootFireball(x, y) {
        if (this.canShootAgain) {
            console.log("Fireball is shooting");
            let fireball = this.add.image(x + 50, y, 'projectile').setInteractive();
            fireball.setScale(0.1);
            this.fireballs.push(fireball); // Add fireball to the fireballs array
            this.canShootAgain = false;
            setTimeout(() => {
                this.canShootAgain = true;
            }, 3000);
        }
    }

    update() {
        this.enemies.forEach(enemy => {
            enemy.x -= 1;

            this.plants.forEach(plant => {
                if (plant.y === enemy.y && plant.texture.key === 'peaShooter' && this.canShootAgain) {
                    this.shootFireball(plant.x, plant.y);
                }
            });
        });
        this.fireballs.forEach(fireball => {
            fireball.x += 3.5; // Corrected to move the fireball
            console.log("Fireball is moving");
            // Optionally, remove fireball from array if it goes off-screen
        });
    }
}
