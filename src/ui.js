// UI system
import { CharacterPreview } from './characterPreview.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.characterPreview = null;
        this.selectedRace = 'human';
        this.setupEventListeners();
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

        // Race selection
        document.querySelectorAll('.race-button').forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected class from all
                document.querySelectorAll('.race-button').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedRace = button.dataset.race;
                
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
                
                this.updatePreview();
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

        document.getElementById('hairColor').addEventListener('input', (e) => {
            this.updatePreview();
        });

        document.getElementById('skinTone').addEventListener('input', (e) => {
            document.getElementById('skinToneValue').textContent = e.target.value;
            this.updatePreview();
        });

        ['health', 'strength', 'magic', 'speed'].forEach(stat => {
            document.getElementById(`${stat}Stat`).addEventListener('input', (e) => {
                document.getElementById(`${stat}Value`).textContent = e.target.value;
            });
        });
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

    updatePreview() {
        if (!this.characterPreview) return;
        
        const hairColor = document.getElementById('hairColor').value;
        const skinTone = parseFloat(document.getElementById('skinTone').value);
        
        this.characterPreview.updateCharacter(this.selectedRace, hairColor, skinTone);
    }

    showHUD() {
        document.getElementById('hud').style.display = 'block';
        document.getElementById('controlsInfo').style.display = 'block';
    }

    hideAllMenus() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('characterSelection').style.display = 'none';
        document.getElementById('characterCreation').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('controlsInfo').style.display = 'none';
    }

    loadCharacterList() {
        const list = document.getElementById('characterList');
        list.innerHTML = '';

        const characters = this.getAllCharacters();
        
        if (characters.length === 0) {
            list.innerHTML = '<p style="color: #ccc; text-align: center; padding: 20px;">No characters created yet. Create one to get started!</p>';
            return;
        }

        characters.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            const raceEmoji = {
                human: '👤',
                elf: '🧝',
                dwarf: '⛏️',
                demon: '😈'
            }[char.race] || '👤';
            card.innerHTML = `
                <h3>${raceEmoji} ${char.name}</h3>
                <p><strong>Race:</strong> ${char.race ? char.race.charAt(0).toUpperCase() + char.race.slice(1) : 'Human'}</p>
                <p>Health: ${char.stats.health}/${char.stats.maxHealth}</p>
                <p>Strength: ${char.stats.strength}</p>
                <p>Magic: ${char.stats.magic}</p>
                <p>Speed: ${char.stats.speed}</p>
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
            document.getElementById('hudHealth').textContent = characterData.stats.health;
            document.getElementById('hudMaxHealth').textContent = characterData.stats.maxHealth;
            document.getElementById('hudStrength').textContent = characterData.stats.strength;
            document.getElementById('hudMagic').textContent = characterData.stats.magic;
            document.getElementById('hudSpeed').textContent = characterData.stats.speed;
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

