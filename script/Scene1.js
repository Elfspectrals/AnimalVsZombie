class Scene1 extends Phaser.Scene {
    constructor() {
        super('Scene1');
        this.plants = [];
        this.enemies = [];
        this.plantSlots = [];
        this.path = null;
        this.graphics = null;
        this.currentPlant = null;
        this.fireballs = []; 
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
                slot.plant = null; 
                this.plantSlots.push(slot);
            }
        };
        generateSlot(50, 100, 100, 50, 0x00ff00);
    
        this.createPlant = (positionX, positionY, typePlant) => {
            let plant = this.add.image(positionX, positionY, typePlant).setInteractive();
            plant.setScale(0.1);
            plant.currentSlot = null; 
            plant.canShoot = false;
            plant.lastShotTime = 0;  // Add lastShotTime property
            this.plants.push(plant);
    
            plant.on('pointerdown', () => {
                let newPlant = this.add.image(plant.x, plant.y, typePlant).setInteractive();
                newPlant.setScale(0.1);
                newPlant.currentSlot = null;  
                newPlant.canShoot = false;
                newPlant.lastShotTime = 0;  // Initialize lastShotTime property
                this.input.setDraggable(newPlant);
                this.plants.push(newPlant); 
    
                newPlant.on('dragstart', () => {
                    this.currentPlant = newPlant;
                    if (newPlant.currentSlot) {
                        newPlant.currentSlot.plant = null;
                        newPlant.currentSlot = null;
                        newPlant.canShoot = false; 
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
    
        this.createEnemy(); 
    }
    
    isOnSlot(plant) {
        let placed = false;
        this.plantSlots.forEach(slot => {
            if (Phaser.Geom.Rectangle.Overlaps(slot.getBounds(), plant.getBounds())) {
                if (!slot.plant) { 
                    slot.plant = plant; 
                    plant.currentSlot = slot;
                    plant.x = slot.x;  
                    plant.y = slot.y;
                    plant.canShoot = true;
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
    
            let enemy = new Enemy(this, 1200, targetSlot.y, 'enemy', 1, 100, 10);
            this.enemies.push(enemy);
        }
    }
    
    shootFireball(x, y) {
        console.log("Fireball is shooting");
        let fireball = this.add.image(x + 50, y, 'projectile').setInteractive();
        fireball.setScale(0.1);
        this.fireballs.push(fireball);
    }

    update() {
        const currentTime = this.time.now;

        this.enemies.forEach(enemy => {
            enemy.update();

            this.plants.forEach(plant => {
                if (
                    plant.y === enemy.sprite.y && 
                    plant.texture.key === 'peaShooter' && 
                    plant.canShoot && 
                    currentTime > plant.lastShotTime + 3000  // Check plant's cooldown
                ) {
                    this.shootFireball(plant.x, plant.y);
                    plant.lastShotTime = currentTime;  // Update lastShotTime
                }
            });
        });
    
        this.fireballs.forEach((fireball, fireballIndex) => {
            fireball.x += 3.5;
            console.log("Fireball is moving");
    
            this.enemies.forEach((enemy, enemyIndex) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(fireball.getBounds(), enemy.sprite.getBounds())) {
                    console.log("Fireball hit an enemy!");
    
                    fireball.destroy();
                    this.fireballs.splice(fireballIndex, 1);
    
                    enemy.takeDamage(50);  // Adjust the damage value as needed
                    if (enemy.health <= 0) {
                        enemy.sprite.destroy();
                        this.enemies.splice(enemyIndex, 1);
                    }
                }
            });
    
            if (fireball.x > this.sys.canvas.width) {
                fireball.destroy();
                this.fireballs.splice(fireballIndex, 1);
            }
        });
    }
}

class Enemy {
    constructor(scene, x, y, texture, speed, health, damage) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, texture).setInteractive();
        this.sprite.setScale(0.1);
        this.sprite.flipX = true;
        this.speed = speed;
        this.health = health;
        this.damage = damage;
    }

    update() {
        this.sprite.x -= this.speed;
    }

    takeDamage(amount) {
        this.health -= amount;
    }
}
