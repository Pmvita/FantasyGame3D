// UI system
import { CharacterPreview } from './characterPreview.js';
import { InventorySystem } from './inventory/inventory.js';
import { SkillsSystem } from './skills/skills.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.characterPreview = null;
        this.selectedRace = 'human';
        this.inventorySystem = null;
        this.skillsSystem = null;
        this.setupEventListeners();
        this.initializeInventory();
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.loadOrCreateCharacter();
        });

        document.getElementById('characterSelectButton').addEventListener('click', () => {
            this.showCharacterSelection();
        });

        document.getElementById('createCharacterButton').addEventListener('click', () => {
            this.showCharacterCreation();
        });

        // Character selection
        document.getElementById('backFromSelectionButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Create new character from selection screen
        const createNewBtn = document.getElementById('createNewFromSelectionButton');
        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => {
                this.showCharacterCreation();
            });
        }

        // Race selection
        document.querySelectorAll('.race-button').forEach(button => {
            button.addEventListener('click', async () => {
                // Remove selected class from all
                document.querySelectorAll('.race-button').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedRace = button.dataset.race;
                
                console.log(`Race selected: ${this.selectedRace}`);
                
                // Apply race-specific default stats
                const raceStats = this.getRaceDefaultStats(this.selectedRace);
                document.getElementById('healthStat').value = raceStats.health;
                document.getElementById('healthValue').textContent = raceStats.health;
                document.getElementById('strengthStat').value = raceStats.strength;
                document.getElementById('strengthValue').textContent = raceStats.strength;
                document.getElementById('magicStat').value = raceStats.magic;
                document.getElementById('magicValue').textContent = raceStats.magic;
                document.getElementById('speedStat').value = raceStats.speed;
                document.getElementById('speedValue').textContent = raceStats.speed;
                
                await this.updatePreview();
            });
        });

        // Character creation
        document.getElementById('saveCharacterButton').addEventListener('click', () => {
            this.saveCharacter();
        });

        document.getElementById('cancelCreationButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Update sliders and preview
        document.getElementById('characterName').addEventListener('input', () => {
            // Name doesn't affect preview
        });

        document.getElementById('hairColor').addEventListener('input', async (e) => {
            await this.updatePreview();
        });

        document.getElementById('skinTone').addEventListener('input', async (e) => {
            document.getElementById('skinToneValue').textContent = e.target.value;
            await this.updatePreview();
        });

        ['health', 'strength', 'magic', 'speed'].forEach(stat => {
            document.getElementById(`${stat}Stat`).addEventListener('input', (e) => {
                document.getElementById(`${stat}Value`).textContent = e.target.value;
            });
        });

        // Settings button
        document.getElementById('settingsButton').addEventListener('click', () => {
            this.toggleSettings();
        });

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            const settingsMenu = document.getElementById('settingsMenu');
            const settingsButton = document.getElementById('settingsButton');
            if (settingsMenu && settingsButton && 
                !settingsMenu.contains(e.target) && 
                !settingsButton.contains(e.target) &&
                settingsMenu.style.display !== 'none') {
                settingsMenu.style.display = 'none';
            }
        });

        // Inventory button
        document.getElementById('inventoryButton').addEventListener('click', () => {
            this.toggleInventory();
        });

        // Close inventory when clicking outside
        document.addEventListener('click', (e) => {
            const inventoryMenu = document.getElementById('inventoryMenu');
            const inventoryButton = document.getElementById('inventoryButton');
            if (inventoryMenu && inventoryButton && 
                !inventoryMenu.contains(e.target) && 
                !inventoryButton.contains(e.target) &&
                inventoryMenu.style.display !== 'none') {
                inventoryMenu.style.display = 'none';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // B key for inventory
            if (e.key.toLowerCase() === 'b' && this.game.character) {
                this.toggleInventory();
            }
            // ESC to close menus
            if (e.key === 'Escape') {
                this.closeAllMenus();
            }
            // Number keys 1-6 for skills
            const skillKey = parseInt(e.key);
            if (skillKey >= 1 && skillKey <= 6 && this.game.character) {
                if (this.skillsSystem) {
                    this.skillsSystem.useSkill(skillKey);
                }
            }
        });
    }

    initializeInventory() {
        // Initialize inventory grid
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = '';
            for (let i = 0; i < 30; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot empty';
                slot.dataset.slot = i;
                inventoryGrid.appendChild(slot);
            }
        }
    }

    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('mainMenu').style.display = 'block';
    }

    showCharacterSelection() {
        this.hideAllMenus();
        document.getElementById('characterSelection').style.display = 'block';
        this.loadCharacterList();
    }

    showCharacterCreation() {
        this.hideAllMenus();
        document.getElementById('characterCreation').style.display = 'block';
        
        // Initialize preview if not already created
        if (!this.characterPreview) {
            this.characterPreview = new CharacterPreview('characterPreviewCanvas');
        }
        
        // Set default race selection
        this.selectedRace = 'human';
        document.querySelectorAll('.race-button').forEach(b => b.classList.remove('selected'));
        document.querySelector('[data-race="human"]').classList.add('selected');
        
        // Reset form to defaults
        document.getElementById('characterName').value = '';
        document.getElementById('hairColor').value = '#8B4513';
        document.getElementById('skinTone').value = 0.5;
        document.getElementById('skinToneValue').textContent = '0.5';
        document.getElementById('healthStat').value = 50;
        document.getElementById('healthValue').textContent = '50';
        document.getElementById('strengthStat').value = 10;
        document.getElementById('strengthValue').textContent = '10';
        document.getElementById('magicStat').value = 10;
        document.getElementById('magicValue').textContent = '10';
        document.getElementById('speedStat').value = 10;
        document.getElementById('speedValue').textContent = '10';
        
        // Update preview with initial values
        this.updatePreview();
    }

    async updatePreview() {
        if (!this.characterPreview) return;
        
        const hairColor = document.getElementById('hairColor').value;
        const skinTone = parseFloat(document.getElementById('skinTone').value);
        
        await this.characterPreview.updateCharacter(this.selectedRace, hairColor, skinTone);
    }

    showHUD() {
        document.getElementById('hud').style.display = 'block';
        document.getElementById('settingsButton').style.display = 'flex';
        document.getElementById('skillsSection').style.display = 'flex';
        document.getElementById('inventoryButton').style.display = 'flex';
        document.getElementById('minimapContainer').style.display = 'block';
        
        // Initialize inventory and skills systems
        if (this.game.character) {
            this.inventorySystem = new InventorySystem(this.game.character);
            this.skillsSystem = new SkillsSystem(this.game.character);
        }
    }

    hideAllMenus() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('characterSelection').style.display = 'none';
        document.getElementById('characterCreation').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('settingsButton').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
        document.getElementById('skillsSection').style.display = 'none';
        document.getElementById('inventoryButton').style.display = 'none';
        document.getElementById('inventoryMenu').style.display = 'none';
        document.getElementById('minimapContainer').style.display = 'none';
    }

    toggleSettings() {
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu.style.display === 'none' || settingsMenu.style.display === '') {
            settingsMenu.style.display = 'block';
        } else {
            settingsMenu.style.display = 'none';
        }
    }

    toggleInventory() {
        const inventoryMenu = document.getElementById('inventoryMenu');
        if (inventoryMenu.style.display === 'none' || inventoryMenu.style.display === '') {
            inventoryMenu.style.display = 'block';
            this.updateInventoryDisplay();
        } else {
            inventoryMenu.style.display = 'none';
        }
    }

    closeAllMenus() {
        document.getElementById('settingsMenu').style.display = 'none';
        document.getElementById('inventoryMenu').style.display = 'none';
    }

    updateInventoryDisplay() {
        if (!this.inventorySystem) return;

        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) return;

        const slots = inventoryGrid.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            const item = this.inventorySystem.getItemAtSlot(index);
            if (item) {
                slot.className = 'inventory-slot';
                slot.innerHTML = `<i class="fas ${item.icon}"></i>`;
                if (item.quantity > 1) {
                    slot.innerHTML += `<span style="position: absolute; bottom: 2px; right: 4px; font-size: 0.7em; background: rgba(0,0,0,0.7); padding: 2px 4px; border-radius: 3px;">${item.quantity}</span>`;
                }
                slot.title = `${item.name}\n${item.description}`;
            } else {
                slot.className = 'inventory-slot empty';
                slot.innerHTML = '';
                slot.title = '';
            }
        });
    }

    loadCharacterList() {
        const list = document.getElementById('characterList');
        list.innerHTML = '';

        const characters = this.getAllCharacters();
        
        if (characters.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon"><i class="fas fa-swords"></i></div>
                    <h3>No Characters Yet</h3>
                    <p>Create your first character to begin your adventure!</p>
                    <button class="create-new-button" id="createFirstCharacterButton">Create Your First Character</button>
                </div>
            `;
            // Add event listener for the create button
            const createBtn = document.getElementById('createFirstCharacterButton');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCharacterCreation();
                });
            }
            return;
        }

        characters.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            const raceIcon = {
                human: '<i class="fas fa-user"></i>',
                elf: '<i class="fas fa-leaf"></i>',
                dwarf: '<i class="fas fa-hammer"></i>',
                demon: '<i class="fas fa-fire"></i>'
            }[char.race] || '<i class="fas fa-user"></i>';
            
            const raceName = char.race ? char.race.charAt(0).toUpperCase() + char.race.slice(1) : 'Human';
            
            card.innerHTML = `
                <div class="character-card-header">
                    <div class="character-card-icon">${raceIcon}</div>
                    <div class="character-card-title">
                        <h3>${char.name || 'Unnamed Character'}</h3>
                        <div class="character-card-race">${raceName}</div>
                    </div>
                </div>
                <div class="character-stats">
                    <div class="stat-item health-stat">
                        <span class="stat-icon"><i class="fas fa-heart"></i></span>
                        <span class="stat-label">Health</span>
                        <span class="stat-value">${char.stats.health}/${char.stats.maxHealth}</span>
                    </div>
                    <div class="stat-item strength-stat">
                        <span class="stat-icon"><i class="fas fa-sword"></i></span>
                        <span class="stat-label">Strength</span>
                        <span class="stat-value">${char.stats.strength}</span>
                    </div>
                    <div class="stat-item magic-stat">
                        <span class="stat-icon"><i class="fas fa-wand-magic-sparkles"></i></span>
                        <span class="stat-label">Magic</span>
                        <span class="stat-value">${char.stats.magic}</span>
                    </div>
                    <div class="stat-item speed-stat">
                        <span class="stat-icon"><i class="fas fa-bolt"></i></span>
                        <span class="stat-label">Speed</span>
                        <span class="stat-value">${char.stats.speed}</span>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                this.selectCharacter(index);
            });
            list.appendChild(card);
        });
    }

    getAllCharacters() {
        const saved = localStorage.getItem('fantasyGameCharacters');
        return saved ? JSON.parse(saved) : [];
    }

    saveCharacter() {
        // Get race-specific default stats
        const raceStats = this.getRaceDefaultStats(this.selectedRace);
        
        const characterData = {
            name: document.getElementById('characterName').value || 'Unnamed Character',
            race: this.selectedRace,
            appearance: {
                hairColor: document.getElementById('hairColor').value,
                skinTone: parseFloat(document.getElementById('skinTone').value),
                bodyShape: 0.5
            },
            stats: {
                health: parseInt(document.getElementById('healthStat').value) || raceStats.health,
                maxHealth: parseInt(document.getElementById('healthStat').value) || raceStats.health,
                strength: parseInt(document.getElementById('strengthStat').value) || raceStats.strength,
                magic: parseInt(document.getElementById('magicStat').value) || raceStats.magic,
                speed: parseInt(document.getElementById('speedStat').value) || raceStats.speed,
                defense: raceStats.defense
            },
            equipment: {
                weapon: null,
                armor: null,
                helmet: null
            }
        };

        const characters = this.getAllCharacters();
        characters.push(characterData);
        localStorage.setItem('fantasyGameCharacters', JSON.stringify(characters));

        this.showMainMenu();
        alert('Character saved!');
    }

    selectCharacter(index) {
        const characters = this.getAllCharacters();
        if (characters[index]) {
            this.game.startGame(characters[index]);
        }
    }

    loadOrCreateCharacter() {
        const characters = this.getAllCharacters();
        if (characters.length > 0) {
            this.selectCharacter(0); // Load first character
        } else {
            this.showCharacterCreation();
        }
    }

    updateHUD(characterData) {
        if (characterData) {
            // Update health bar
            const health = characterData.stats.health || 0;
            const maxHealth = characterData.stats.maxHealth || 100;
            const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
            
            document.getElementById('hudHealth').textContent = health;
            document.getElementById('hudMaxHealth').textContent = maxHealth;
            document.getElementById('healthBarFill').style.width = `${healthPercent}%`;
            
            // Update magic bar (using magic stat as current, max is same as magic stat for now)
            const magic = characterData.stats.magic || 0;
            const maxMagic = characterData.stats.magic || 10; // Use magic stat as max for now
            const magicPercent = maxMagic > 0 ? (magic / maxMagic) * 100 : 0;
            
            document.getElementById('hudMagic').textContent = magic;
            document.getElementById('hudMaxMagic').textContent = maxMagic;
            document.getElementById('magicBarFill').style.width = `${magicPercent}%`;
            
            // Update stats
            document.getElementById('hudStrength').textContent = characterData.stats.strength || 10;
            
            // Initialize energy display (starts at 100)
            const energy = characterData.stats.speed || 100;
            document.getElementById('hudEnergy').textContent = 100;
        }
    }
    
    updateEnergyDisplay(character) {
        if (!character) return;
        
        const energyData = character.getEnergy();
        const energyIcon = document.getElementById('energyIcon');
        const energyTimer = document.getElementById('energyTimer');
        
        // Update energy value
        document.getElementById('hudEnergy').textContent = energyData.current;
        
        // Update timer display (countdown from 10s to 0s)
        const timeRemaining = Math.ceil(energyData.regenInterval - energyData.regenTimer);
        if (energyData.current < energyData.max) {
            energyTimer.textContent = `${timeRemaining}s`;
        } else {
            energyTimer.textContent = '';
        }
        
        // Update icon color based on state
        if (character.isRunning && character.isMoving) {
            // Running and depleting - red
            energyIcon.className = 'fas fa-bolt energy-depleting';
        } else if (!character.isRunning && energyData.current < energyData.max) {
            // Regenerating - green
            energyIcon.className = 'fas fa-bolt energy-regenerating';
        } else {
            // Normal state - default color
            energyIcon.className = 'fas fa-bolt energy-normal';
        }
    }

    getRaceDefaultStats(race) {
        const stats = {
            human: { health: 50, strength: 10, magic: 10, speed: 10, defense: 10 },
            elf: { health: 40, strength: 8, magic: 15, speed: 12, defense: 8 },
            dwarf: { health: 60, strength: 15, magic: 5, speed: 8, defense: 15 },
            demon: { health: 55, strength: 12, magic: 12, speed: 10, defense: 12 }
        };
        return stats[race] || stats.human;
    }
}

