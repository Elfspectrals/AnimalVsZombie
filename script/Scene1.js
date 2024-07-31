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
            if (this.scene.sunMoney >= this.cost) {
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
                        scene.updateSunMoney(-newPlant.cost);
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
            } else {
                console.log('Not enough sun money to place this plant');
            }
        });
    }
}

class Enemy {
    constructor(scene, x, y, type, size = 0.1) {
        this.scene = scene;
        this.type = type;

        const enemyConfig = this.getEnemyConfig(type);
        this.sprite = scene.add.image(x, y, enemyConfig.texture).setInteractive();
        this.sprite.setScale(enemyConfig.size || size);
        this.sprite.flipX = true;
        this.speed = enemyConfig.speed;
        this.health = enemyConfig.health;
        this.damage = enemyConfig.damage;
    }

    getEnemyConfig(type) {
        const enemyConfigs = {
            normal: { texture: 'enemy', speed: 1, health: 100, damage: 10 },
            tank: { texture: 'enemyTank', speed: 0.5, health: 300, damage: 20, size: 0.4 },
            // Add more enemy types as needed
        };
        return enemyConfigs[type];
    }

    update() {
        this.sprite.x -= this.speed;
    }

    takeDamage(amount) {
        this.health -= amount;
    }
}
class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.waves = [
            // { type: 'normal', quantity: 2, interval: 2000 },
            { type: 'tank', quantity: 1, interval: 1000 },
            // Add more waves as needed
        ];
    }

    startWave() {
        if (this.currentWave < this.waves.length) {
            let waveConfig = this.waves[this.currentWave];
            let waveTitle = document.getElementById('WaveTitle');
            waveTitle.innerHTML = `Wave ${this.currentWave + 1}`;
            
            this.spawnEnemies(waveConfig.type, waveConfig.quantity, waveConfig.interval);
            this.currentWave++;
        }
    }

    spawnEnemies(type, quantity, interval) {
        let enemiesSpawned = 0;
        let spawnInterval = this.scene.time.addEvent({
            delay: interval,
            callback: () => {
                if (enemiesSpawned < quantity) {
                    this.scene.createEnemy(type);
                    enemiesSpawned++;
                } else {
                    spawnInterval.remove();
                    // Check if all waves are completed and no enemies are left
                    this.scene.time.addEvent({
                        delay: 5000, // 5 seconds delay before the next wave
                        callback: () => {
                            if (this.currentWave >= this.waves.length && this.scene.enemies.length === 0) {
                                alert("All waves completed!");
                            } else {
                                this.startWave();
                            }
                        }
                    });
                }
            },
            callbackScope: this,
            loop: true
        });
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
        this.waveManager = null; // Initialize wave manager
        this.sunMoney = 100;  // Initialize sun money
    }

    preload() {
        this.load.image('peaShooter', './assets/placeholder.png');
        this.load.image('sunFlower', './assets/placeholder2.png');
        this.load.image('enemy', './assets/placeholder.png');
        this.load.image('enemyTank', './assets/placeholderTank.png'); // Add tank enemy image
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

        this.waveManager = new WaveManager(this); // Initialize the wave manager
        this.waveManager.startWave(); // Start the first wave
    }

    getPlantConfig(typePlant) {
        const plantConfigs = {
            peaShooter: { attackSpeed: 3000, cost: 100, health: 100 },
            sunFlower: { attackSpeed: 0, cost: 50, health: 50 },
        };
        return plantConfigs[typePlant];
    }

    updateSunMoney(amount) {
        this.sunMoney += amount;
        document.getElementById('sunMoney').innerText = this.sunMoney;
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

    createEnemy(type) {
        if (this.plantSlots.length > 0) {
            let randomSlotIndex = Phaser.Math.Between(0, this.plantSlots.length - 1);
            let targetSlot = this.plantSlots[randomSlotIndex];

            let enemy = new Enemy(this, 1200, targetSlot.y, type);
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

        this.enemies.forEach((enemy, enemyIndex) => {
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

            this.fireballs.forEach((fireball, fireballIndex) => {
                fireball.x += 3.5;
                console.log("Fireball is moving");

                if (Phaser.Geom.Intersects.RectangleToRectangle(fireball.getBounds(), enemy.sprite.getBounds())) {
                    console.log("Fireball hit an enemy!");

                    fireball.destroy();
                    this.fireballs.splice(fireballIndex, 1);

                    enemy.takeDamage(50);
                    if (enemy.health <= 0) {
                        enemy.sprite.destroy();
                        this.enemies.splice(enemyIndex, 1);

                        // Check if all waves are completed and no enemies are left
                        if (this.waveManager.currentWave >= this.waveManager.waves.length && this.enemies.length === 0) {
                            alert("All waves completed!");
                        }
                    }
                }

                if (fireball.x > this.sys.canvas.width) {
                    fireball.destroy();
                    this.fireballs.splice(fireballIndex, 1);
                }
            });
        });
    }
}
