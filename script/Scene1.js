class Plant {
    constructor(scene, x, y, typePlant, attackSpeed, cost, health) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, typePlant).setInteractive();
        this.sprite.setScale(0.1);
        this.sprite.plantType = typePlant;  // Store the plant type
        this.attackSpeed = attackSpeed;
        this.cost = cost;
        this.health = health;
        this.currentSlot = null;
        this.canShoot = false;
        this.lastShotTime = 0;
        
        this.sprite.on('pointerdown', () => {
            let newPlant = new Plant(scene, this.sprite.x, this.sprite.y, typePlant, attackSpeed, cost, health);
            scene.input.setDraggable(newPlant.sprite);
            scene.plants.push(newPlant);

            newPlant.sprite.on('dragstart', () => {
                scene.currentPlant = newPlant;
                if (newPlant.currentSlot) {
                    newPlant.currentSlot.plant = null;
                    newPlant.currentSlot = null;
                    newPlant.canShoot = false;
                }
            });

            newPlant.sprite.on('drag', (pointer, dragX, dragY) => {
                newPlant.sprite.x = dragX;
                newPlant.sprite.y = dragY;
            });

            newPlant.sprite.on('dragend', () => {
                if (scene.isOnSlot(newPlant)) {
                    console.log('Plant placed on a valid slot');
                } else {
                    const index = scene.plants.indexOf(newPlant);
                    if (index > -1) {
                        scene.plants.splice(index, 1);
                    }
                    newPlant.sprite.destroy();
                }
                scene.currentPlant = null;
            });
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

        const generateSlots = (startX, startY, gapX, gapY, slotSize, color, numColumns, numRows) => {
            for (let col = 0; col < numColumns; col++) {
                for (let row = 0; row < numRows; row++) {
                    let x = startX + col * gapX;
                    let y = startY + row * gapY;
                    let slot = this.add.rectangle(x, y, slotSize, slotSize, color);
                    slot.setStrokeStyle(2, 0xffffff);
                    slot.plant = null;
                    this.plantSlots.push(slot);
                }
            }
        };

        generateSlots(50, 100, 100, 100, 50, 0x00ff00, 6, 5);  // Create a grid with 6 columns and 5 rows

        this.createPlant = (positionX, positionY, typePlant) => {
            let plantConfig = this.getPlantConfig(typePlant);
            let plant = new Plant(this, positionX, positionY, typePlant, plantConfig.attackSpeed, plantConfig.cost, plantConfig.health);
            this.plants.push(plant);
        };

        this.createPlant(800, 50, 'peaShooter');
        this.createPlant(900, 50, 'sunFlower');

        // Create a timed event to spawn enemies every 2 seconds
        this.time.addEvent({
            delay: 2000,
            callback: this.createEnemy,
            callbackScope: this,
            loop: true
        });
    }

    getPlantConfig(typePlant) {
        const plantConfigs = {
            peaShooter: { attackSpeed: 3000, cost: 100, health: 100 },
            sunFlower: { attackSpeed: 0, cost: 50, health: 50 },
        };
        return plantConfigs[typePlant];
    }

    isOnSlot(plant) {
        let placed = false;
        this.plantSlots.forEach(slot => {
            if (Phaser.Geom.Rectangle.Overlaps(slot.getBounds(), plant.sprite.getBounds())) {
                if (!slot.plant) {
                    slot.plant = plant;
                    plant.currentSlot = slot;
                    plant.sprite.x = slot.x;
                    plant.sprite.y = slot.y;
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
                    plant.sprite.y === enemy.sprite.y &&
                    plant.sprite.texture.key === 'peaShooter' &&
                    plant.canShoot &&
                    currentTime > plant.lastShotTime + plant.attackSpeed
                ) {
                    this.shootFireball(plant.sprite.x, plant.sprite.y);
                    plant.lastShotTime = currentTime;
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

                    enemy.takeDamage(50);
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
