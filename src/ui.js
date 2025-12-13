// UI system
import { CharacterPreview } from './characterPreview.js';
import { InventorySystem } from './inventory/inventory.js';
import { SkillsSystem } from './skills/skills.js';
import * as authAPI from './api/auth.js';
import * as charactersAPI from './api/characters.js';
import { getToken, removeToken } from './api/client.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.characterPreview = null;
        this.selectedRace = 'human';
        this.selectedGender = 'male'; // 'male' or 'female'
        this.inventorySystem = null;
        this.skillsSystem = null;
        this.skillCooldowns = {}; // Track cooldowns for each skill slot
        this.setupEventListeners();
        this.initializeInventory();
    }

    setupEventListeners() {
        // Login screen buttons
        document.getElementById('loginButton').addEventListener('click', () => {
            this.handleLogin();
        });

        // Allow Enter key to submit login
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('passwordInput').focus();
            }
        });

        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        document.getElementById('createAccountLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showCreateAccountScreen();
        });

        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Password reset functionality coming soon!');
        });

        document.getElementById('needHelpLink').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Help documentation coming soon!');
        });

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

        // Logout button
        document.getElementById('logoutButton').addEventListener('click', () => {
            this.handleLogout();
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

        // Gender selection
        document.querySelectorAll('.gender-button').forEach(button => {
            button.addEventListener('click', async () => {
                // Remove selected class from all
                document.querySelectorAll('.gender-button').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedGender = button.dataset.gender;
                
                console.log(`Gender selected: ${this.selectedGender}`);
                await this.updatePreview();
            });
        });

        // Customization slider controls
        this.setupSliderControls('hairStyle', 'hairStylePrev', 'hairStyleNext', 'hairStyleValue');
        this.setupSliderControls('faceType', 'faceTypePrev', 'faceTypeNext', 'faceTypeValue');
        this.setupSliderControls('facialFeatures', 'facialFeaturesPrev', 'facialFeaturesNext', 'facialFeaturesValue');

        // Customization sliders
        ['hairStyle', 'faceType', 'facialFeatures', 'skinTone', 'bodyShape'].forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', () => {
                    const valueDisplay = document.getElementById(id + 'Value');
                    if (valueDisplay) {
                        if (id === 'skinTone' || id === 'bodyShape') {
                            valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
                        } else {
                            valueDisplay.textContent = parseInt(slider.value) + 1;
                        }
                    }
                    this.updatePreview();
                });
            }
        });

        // Hair color change
        document.getElementById('hairColor').addEventListener('input', () => {
            this.updatePreview();
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
            // Number keys 1-9 and 0 for skills (0 = slot 10)
            let skillKey = null;
            if (e.key === '0') {
                skillKey = 0; // Slot 0 (internally slot 10)
            } else {
                const parsed = parseInt(e.key);
                if (parsed >= 1 && parsed <= 9) {
                    skillKey = parsed;
                }
            }
            if (skillKey !== null) {
                this.activateSkill(skillKey);
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

    async handleLogin() {
        const username = document.getElementById('usernameInput').value.trim();
        const password = document.getElementById('passwordInput').value;
        const remember = document.getElementById('rememberCheckbox').checked;
        const loginButton = document.getElementById('loginButton');

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        // Disable button and show loading
        loginButton.disabled = true;
        loginButton.textContent = 'LOGGING IN...';

        try {
            // Call login API
            const response = await authAPI.login(username, password);

            // Store login info if remember is checked
            if (remember) {
                localStorage.setItem('fantasy3DUsername', username);
            } else {
                localStorage.removeItem('fantasy3DUsername');
            }

            // Check for LocalStorage characters to migrate
            await this.checkForLocalStorageMigration();

            // Hide login screen and show main menu
            this.hideLoginScreen();
            this.showMainMenu();
        } catch (error) {
            this.showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            // Re-enable button
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        // Load saved username if exists
        const savedUsername = localStorage.getItem('fantasy3DUsername');
        if (savedUsername) {
            document.getElementById('usernameInput').value = savedUsername;
            document.getElementById('rememberCheckbox').checked = true;
        }
    }

    hideLoginScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
    }

    showCreateAccountScreen() {
        this.hideLoginScreen();
        document.getElementById('createAccountScreen').classList.remove('hidden');
        this.setupAccountCreationListeners();
    }

    hideCreateAccountScreen() {
        document.getElementById('createAccountScreen').classList.add('hidden');
    }

    setupAccountCreationListeners() {
        // Remove existing listeners to avoid duplicates
        const registerButton = document.getElementById('registerButton');
        const backToLoginLink = document.getElementById('backToLoginLink');
        const registerPasswordInput = document.getElementById('registerPasswordInput');
        const registerConfirmPasswordInput = document.getElementById('registerConfirmPasswordInput');

        // Remove old listeners by cloning elements
        const newRegisterButton = registerButton.cloneNode(true);
        registerButton.parentNode.replaceChild(newRegisterButton, registerButton);
        const newBackLink = backToLoginLink.cloneNode(true);
        backToLoginLink.parentNode.replaceChild(newBackLink, backToLoginLink);

        // Add new listeners
        document.getElementById('registerButton').addEventListener('click', () => {
            this.handleRegister();
        });

        document.getElementById('backToLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideCreateAccountScreen();
            this.showLoginScreen();
        });

        // Password strength indicator
        if (registerPasswordInput) {
            registerPasswordInput.addEventListener('input', () => {
                this.updatePasswordStrength();
            });
        }

        // Enter key handlers
        document.getElementById('registerUsernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('registerEmailInput').focus();
            }
        });

        document.getElementById('registerEmailInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('registerPasswordInput').focus();
            }
        });

        document.getElementById('registerPasswordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('registerConfirmPasswordInput').focus();
            }
        });

        document.getElementById('registerConfirmPasswordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleRegister();
            }
        });
    }

    updatePasswordStrength() {
        const password = document.getElementById('registerPasswordInput').value;
        const strengthDiv = document.getElementById('passwordStrength');

        if (!password) {
            strengthDiv.textContent = '';
            strengthDiv.className = 'password-strength';
            return;
        }

        let strength = 'weak';
        let message = 'Weak password';

        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            strength = 'strong';
            message = 'Strong password';
        } else if (password.length >= 6) {
            strength = 'medium';
            message = 'Medium password';
        }

        strengthDiv.textContent = message;
        strengthDiv.className = `password-strength ${strength}`;
    }

    async handleRegister() {
        const username = document.getElementById('registerUsernameInput').value.trim();
        const email = document.getElementById('registerEmailInput').value.trim();
        const password = document.getElementById('registerPasswordInput').value;
        const confirmPassword = document.getElementById('registerConfirmPasswordInput').value;
        const registerButton = document.getElementById('registerButton');
        const registerButtonText = document.getElementById('registerButtonText');
        const registerButtonSpinner = document.getElementById('registerButtonSpinner');
        const errorMessage = document.getElementById('registerErrorMessage');
        const successMessage = document.getElementById('registerSuccessMessage');

        // Clear previous messages
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // Client-side validation
        if (!username || username.length < 3) {
            errorMessage.textContent = 'Username must be at least 3 characters';
            return;
        }

        if (username.length > 20) {
            errorMessage.textContent = 'Username must be at most 20 characters';
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errorMessage.textContent = 'Username can only contain letters, numbers, and underscores';
            return;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorMessage.textContent = 'Invalid email format';
            return;
        }

        if (!password || password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            return;
        }

        // Show loading state
        registerButton.disabled = true;
        registerButtonText.style.display = 'none';
        registerButtonSpinner.style.display = 'inline-block';

        try {
            // Call register API
            const response = await authAPI.register(username, email || null, password);

            // Show success message
            successMessage.textContent = 'Account created successfully! Logging in...';

            // Auto-login after a brief delay
            setTimeout(async () => {
                try {
                    // Login with the new credentials
                    await authAPI.login(username, password);

                    // Check for LocalStorage migration
                    await this.checkForLocalStorageMigration();

                    // Hide account creation screen and show main menu
                    this.hideCreateAccountScreen();
                    this.showMainMenu();
                } catch (loginError) {
                    errorMessage.textContent = 'Account created but login failed. Please try logging in manually.';
                }
            }, 1000);
        } catch (error) {
            errorMessage.textContent = error.message || 'Registration failed. Please try again.';
        } finally {
            // Reset button state
            registerButton.disabled = false;
            registerButtonText.style.display = 'inline';
            registerButtonSpinner.style.display = 'none';
        }
    }

    showError(message) {
        // Try to show error in a message area, or use alert as fallback
        const errorDiv = document.getElementById('loginErrorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    async checkForLocalStorageMigration() {
        // Check if user has LocalStorage characters to migrate
        const localCharacters = localStorage.getItem('fantasy3DCharacters');
        if (!localCharacters) {
            return; // No local characters to migrate
        }

        try {
            const parsed = JSON.parse(localCharacters);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return; // No valid characters
            }

            // Check if user already has characters in MongoDB
            const cloudCharacters = await charactersAPI.getCharacters();
            
            if (cloudCharacters.length > 0) {
                // User already has cloud characters, ask if they want to merge
                const shouldMerge = confirm(
                    `You have ${parsed.length} local character(s) and ${cloudCharacters.length} cloud character(s). ` +
                    'Would you like to import your local characters to your account?'
                );

                if (!shouldMerge) {
                    return;
                }
            } else {
                // No cloud characters, ask to import
                const shouldImport = confirm(
                    `Would you like to import your ${parsed.length} local character(s) to your account?`
                );

                if (!shouldImport) {
                    return;
                }
            }

            // Migrate characters
            let migratedCount = 0;
            for (const char of parsed) {
                try {
                    await charactersAPI.createCharacter({
                        name: char.name,
                        race: char.race,
                        gender: char.gender || 'male', // Default to 'male' for backward compatibility
                        appearance: char.appearance || {},
                        stats: char.stats,
                        equipment: char.equipment || { weapon: null, armor: null, helmet: null },
                    });
                    migratedCount++;
                } catch (error) {
                    console.error('Failed to migrate character:', char.name, error);
                }
            }

            if (migratedCount > 0) {
                alert(`Successfully imported ${migratedCount} character(s) to your account!`);
                // Clear LocalStorage after successful migration
                localStorage.removeItem('fantasy3DCharacters');
            }
        } catch (error) {
            console.error('Migration error:', error);
            // Don't block user if migration fails
        }
    }

    showMainMenu() {
        this.hideAllMenus();
        this.hideLoginScreen();
        const mainMenu = document.getElementById('mainMenu');
        mainMenu.classList.remove('hidden');
        mainMenu.style.display = 'flex';
        
        // Update username display
        this.updateMainMenuUsername();
    }

    updateMainMenuUsername() {
        const usernameElement = document.getElementById('mainMenuUsername');
        if (usernameElement) {
            // Try to get username from localStorage first
            const savedUsername = localStorage.getItem('fantasy3DUsername');
            if (savedUsername) {
                usernameElement.textContent = savedUsername;
            } else {
                // Try to decode token to get username
                try {
                    const token = getToken();
                    if (token) {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        if (payload.username) {
                            usernameElement.textContent = payload.username;
                        }
                    }
                } catch (e) {
                    // If token decode fails, use default
                    usernameElement.textContent = 'Adventurer';
                }
            }
        }
    }

    handleLogout() {
        // Clear authentication data
        removeToken();
        localStorage.removeItem('fantasy3DUsername');
        
        // Hide main menu and show login screen
        this.hideAllMenus();
        this.showLoginScreen();
        
        // Clear any error messages
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }

    async showCharacterSelection() {
        this.hideAllMenus();
        const characterSelection = document.getElementById('characterSelection');
        characterSelection.classList.remove('hidden');
        characterSelection.style.display = 'flex';
        await this.loadCharacterList();
    }

    showCharacterCreation() {
        this.hideAllMenus();
        const characterCreation = document.getElementById('characterCreation');
        characterCreation.classList.remove('hidden');
        characterCreation.style.display = 'flex';
        
        // Initialize preview if not already created
        if (!this.characterPreview) {
            this.characterPreview = new CharacterPreview('characterPreviewCanvas');
        }
        
        // Set default race selection
        this.selectedRace = 'human';
        document.querySelectorAll('.race-button').forEach(b => b.classList.remove('selected'));
        document.querySelector('[data-race="human"]').classList.add('selected');
        
        // Set default gender selection
        this.selectedGender = 'male';
        document.querySelectorAll('.gender-button').forEach(b => b.classList.remove('selected'));
        document.getElementById('genderMale').classList.add('selected');
        
        // Reset form to defaults
        document.getElementById('characterName').value = '';
        document.getElementById('hairColor').value = '#8B4513';
        document.getElementById('hairStyle').value = 0;
        document.getElementById('hairStyleValue').textContent = '1';
        document.getElementById('faceType').value = 0;
        document.getElementById('faceTypeValue').textContent = '1';
        document.getElementById('facialFeatures').value = 0;
        document.getElementById('facialFeaturesValue').textContent = '1';
        document.getElementById('skinTone').value = 0.5;
        document.getElementById('skinToneValue').textContent = '0.5';
        document.getElementById('bodyShape').value = 0.5;
        document.getElementById('bodyShapeValue').textContent = '0.5';
        
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
        
        // Update preview with initial values
        this.updatePreview();
    }

    setupSliderControls(sliderId, prevId, nextId, valueId) {
        const slider = document.getElementById(sliderId);
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        const valueDisplay = document.getElementById(valueId);
        
        if (!slider || !prevBtn || !nextBtn || !valueDisplay) return;

        prevBtn.addEventListener('click', () => {
            const current = parseInt(slider.value);
            if (current > parseInt(slider.min)) {
                slider.value = current - 1;
                valueDisplay.textContent = (current - 1 + 1).toString();
                slider.dispatchEvent(new Event('input'));
            }
        });

        nextBtn.addEventListener('click', () => {
            const current = parseInt(slider.value);
            if (current < parseInt(slider.max)) {
                slider.value = current + 1;
                valueDisplay.textContent = (current + 1 + 1).toString();
                slider.dispatchEvent(new Event('input'));
            }
        });
    }

    async updatePreview() {
        if (!this.characterPreview) return;
        
        const hairColor = document.getElementById('hairColor').value;
        const skinTone = parseFloat(document.getElementById('skinTone').value);
        const faceType = parseInt(document.getElementById('faceType').value);
        const hairStyle = parseInt(document.getElementById('hairStyle').value);
        const facialFeatures = parseInt(document.getElementById('facialFeatures').value);
        
        await this.characterPreview.updateCharacter(
            this.selectedRace, 
            this.selectedGender, 
            hairColor, 
            skinTone, 
            faceType, 
            hairStyle, 
            facialFeatures
        );
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
        
        // Setup click handlers for skill slots
        this.setupSkillSlotClicks();
    }
    
    setupSkillSlotClicks() {
        // Get all skill slots (excluding auto-attack)
        const skillSlots = document.querySelectorAll('.skill-slot[data-slot]:not([data-slot="auto"])');
        
        skillSlots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                const slotIdentifier = slot.dataset.slot;
                
                // Handle numeric slots (1-0) and string slots (potion1, potion2, elixir1, elixir2)
                let skillKey = null;
                if (slotIdentifier === '0') {
                    skillKey = 0;
                } else if (!isNaN(parseInt(slotIdentifier))) {
                    skillKey = parseInt(slotIdentifier);
                } else {
                    // Handle potion/elixir slots (potion1, potion2, elixir1, elixir2)
                    skillKey = slotIdentifier;
                }
                
                if (skillKey !== null) {
                    this.activateSkill(skillKey);
                }
            });
        });
    }
    
    activateSkill(skillKey) {
        if (!this.game || !this.game.character) return;
        
        // Check if skill is on cooldown
        if (this.isSkillOnCooldown(skillKey)) {
            return; // Don't activate if on cooldown
        }
        
        // Start cooldown
        this.startSkillCooldown(skillKey);
        
        // Trigger mystical animation on the corresponding skill slot
        this.triggerSkillAnimation(skillKey);
        
        // Only use skills system for numeric slots (1-0)
        if (this.skillsSystem && typeof skillKey === 'number') {
            this.skillsSystem.useSkill(skillKey);
        } else if (typeof skillKey === 'string') {
            // Handle potion/elixir usage (can be implemented later)
            console.log(`Using ${skillKey}`);
        }
    }

    hideAllMenus() {
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.display = 'none';
            mainMenu.classList.add('hidden');
        }
        const characterSelection = document.getElementById('characterSelection');
        if (characterSelection) {
            characterSelection.style.display = 'none';
            characterSelection.classList.add('hidden');
        }
        const characterCreation = document.getElementById('characterCreation');
        if (characterCreation) {
            characterCreation.style.display = 'none';
            characterCreation.classList.add('hidden');
        }
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

    /**
     * Loads and displays the list of saved characters in the character selection screen.
     * Each character card includes a delete button for character management.
     */
    async loadCharacterList() {
        const list = document.getElementById('characterList');
        list.innerHTML = '';

        const characters = await this.getAllCharacters();
        
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
            card.dataset.characterIndex = index;
            card.dataset.characterId = char.id || index; // Store API ID if available
            const raceIcon = {
                human: '<i class="fas fa-user"></i>',
                elf: '<i class="fas fa-leaf"></i>',
                dwarf: '<i class="fas fa-hammer"></i>',
                demon: '<i class="fas fa-fire"></i>'
            }[char.race] || '<i class="fas fa-user"></i>';
            
            const raceName = char.race ? char.race.charAt(0).toUpperCase() + char.race.slice(1) : 'Human';
            const genderIcon = char.gender === 'female' ? '<i class="fas fa-venus"></i>' : '<i class="fas fa-mars"></i>';
            const genderName = char.gender === 'female' ? 'Female' : 'Male';
            
            card.innerHTML = `
                <button class="character-delete-button" data-character-index="${index}" aria-label="Delete character">
                    <i class="fas fa-times"></i>
                </button>
                <div class="character-card-header">
                    <div class="character-card-icon">${raceIcon}</div>
                    <div class="character-card-title">
                        <h3>${char.name || 'Unnamed Character'}</h3>
                        <div class="character-card-race">${raceName} ${genderIcon} ${genderName}</div>
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
            
            // Add click handler for card selection (but not when clicking delete button)
            card.addEventListener('click', (e) => {
                // Don't select if clicking the delete button
                if (!e.target.closest('.character-delete-button')) {
                    this.selectCharacter(index);
                }
            });
            
            // Add click handler for delete button
            const deleteButton = card.querySelector('.character-delete-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card selection
                    this.showDeleteConfirmation(index, char.name || 'Unnamed Character');
                });
            }
            
            list.appendChild(card);
        });
    }

    /**
     * Retrieves all saved characters from API.
     * Falls back to LocalStorage if not authenticated.
     * @returns {Promise<Array>} - Array of character objects, or empty array if none exist
     */
    async getAllCharacters() {
        // Check if user is authenticated
        const token = getToken();
        if (!token) {
            // Fallback to LocalStorage for unauthenticated users
        try {
                const saved = localStorage.getItem('fantasy3DCharacters');
            if (!saved) {
                return [];
            }
            return JSON.parse(saved);
        } catch (error) {
            console.error('Error loading characters from localStorage:', error);
            return [];
        }
    }

        // Fetch from API
        try {
            const characters = await charactersAPI.getCharacters();
            return characters || [];
        } catch (error) {
            console.error('Error loading characters from API:', error);
            // Fallback to LocalStorage on error
            try {
                const saved = localStorage.getItem('fantasy3DCharacters');
                if (!saved) {
                    return [];
                }
                return JSON.parse(saved);
            } catch (localError) {
                console.error('Error loading characters from localStorage:', localError);
                return [];
            }
        }
    }

    async saveCharacter() {
        // Get race-specific default stats
        const raceStats = this.getRaceDefaultStats(this.selectedRace);
        
        const characterData = {
            name: document.getElementById('characterName').value || 'Unnamed Character',
            race: this.selectedRace,
            gender: this.selectedGender,
            appearance: {
                hairColor: document.getElementById('hairColor').value,
                skinTone: parseFloat(document.getElementById('skinTone').value),
                bodyShape: parseFloat(document.getElementById('bodyShape').value) || 0.5,
                faceType: parseInt(document.getElementById('faceType').value) || 0,
                hairStyle: parseInt(document.getElementById('hairStyle').value) || 0,
                facialFeatures: parseInt(document.getElementById('facialFeatures').value) || 0
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

        const saveButton = document.getElementById('saveCharacterButton');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'SAVING...';

        try {
            // Check if user is authenticated
            const token = getToken();
            if (token) {
                // Save to API
                await charactersAPI.createCharacter(characterData);
        this.showMainMenu();
                alert('Character saved to your account!');
            } else {
                // Fallback to LocalStorage
                const characters = await this.getAllCharacters();
                characters.push(characterData);
                localStorage.setItem('fantasy3DCharacters', JSON.stringify(characters));
                this.showMainMenu();
                alert('Character saved locally! Create an account to sync across devices.');
            }
        } catch (error) {
            console.error('Error saving character:', error);
            alert('Failed to save character: ' + (error.message || 'Unknown error'));
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }

    async selectCharacter(index) {
        const characters = await this.getAllCharacters();
        if (characters[index]) {
            // Convert API character format to game format if needed
            const character = characters[index];
            this.game.startGame(character);
        }
    }

    /**
     * Shows a confirmation dialog before deleting a character.
     * @param {number} characterIndex - The index of the character to delete
     * @param {string} characterName - The name of the character to display in confirmation
     */
    showDeleteConfirmation(characterIndex, characterName) {
        const confirmed = confirm(
            `Are you sure you want to delete "${characterName}"?\n\nThis action cannot be undone.`
        );
        
        if (confirmed) {
            this.deleteCharacter(characterIndex);
        }
    }

    /**
     * Deletes a character from API or localStorage and updates the UI.
     * @param {number} characterIndex - The index of the character to delete
     * @returns {Promise<boolean>} - Returns true if deletion was successful, false otherwise
     */
    async deleteCharacter(characterIndex) {
        try {
            const characters = await this.getAllCharacters();
            
            // Validate index
            if (characterIndex < 0 || characterIndex >= characters.length) {
                console.error('Invalid character index for deletion:', characterIndex);
                alert('Error: Invalid character index. Please refresh the page and try again.');
                return false;
            }
            
            // Store character info for feedback
            const characterToDelete = characters[characterIndex];
            const deletedCharacterName = characterToDelete.name || 'Unnamed Character';
            const characterId = characterToDelete.id;
            
            // Check if user is authenticated
            const token = getToken();
            if (token && characterId) {
                // Delete from API
                try {
                    await charactersAPI.deleteCharacter(characterId);
                } catch (apiError) {
                    console.error('API deletion error:', apiError);
                    alert('Failed to delete character from server: ' + (apiError.message || 'Unknown error'));
                    return false;
                }
            } else {
                // Fallback to LocalStorage
            characters.splice(characterIndex, 1);
            try {
                    localStorage.setItem('fantasy3DCharacters', JSON.stringify(characters));
            } catch (storageError) {
                console.error('Failed to save characters to localStorage:', storageError);
                alert('Error: Failed to save changes. Please check your browser storage settings.');
                return false;
                }
            }
            
            // Reload character list to reflect changes
            await this.loadCharacterList();
            
            // Show feedback
            console.log(`Character "${deletedCharacterName}" deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting character:', error);
            alert('An unexpected error occurred while deleting the character. Please try again.');
            return false;
        }
    }

    async loadOrCreateCharacter() {
        const characters = await this.getAllCharacters();
        if (characters.length > 0) {
            await this.selectCharacter(0); // Load first character
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

    triggerSkillAnimation(slotNumber) {
        // Find the skill slot element by data-slot attribute
        const skillSlot = document.querySelector(`.skill-slot[data-slot="${slotNumber}"]`);
        if (!skillSlot) return;
        
        // Remove any existing animation class
        skillSlot.classList.remove('activated');
        
        // Force reflow to restart animation
        void skillSlot.offsetWidth;
        
        // Add the activated class to trigger animation
        skillSlot.classList.add('activated');
        
        // Remove the class after animation completes
        setTimeout(() => {
            skillSlot.classList.remove('activated');
        }, 600); // Match animation duration
    }

    isSkillOnCooldown(slotNumber) {
        return this.skillCooldowns[slotNumber] === true;
    }

    startSkillCooldown(slotNumber) {
        // Find the skill slot element
        const skillSlot = document.querySelector(`.skill-slot[data-slot="${slotNumber}"]`);
        if (!skillSlot) return;
        
        // Mark as on cooldown
        this.skillCooldowns[slotNumber] = true;
        
        // Add cooldown class to show visual effect
        skillSlot.classList.add('on-cooldown');
        
        // Remove cooldown after 3 seconds
        setTimeout(() => {
            this.skillCooldowns[slotNumber] = false;
            skillSlot.classList.remove('on-cooldown');
        }, 3000);
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

