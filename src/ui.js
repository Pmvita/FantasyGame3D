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
        this.userRole = 'user'; // User role (admin or user) - loaded from auth
        this.selectedClassRank = null; // Selected class rank (for admin users)
        this.classRankSelectListenerAdded = false; // Flag to track if class rank select listener has been added
        this.setupEventListeners();
        this.initializeInventory();
        this.onboardingStep = 0;
        this.onboardingSteps = [
            {
                title: 'Welcome to Fantasy3D!',
                text: 'Embark on an epic adventure in a magical 3D world. Let\'s get you started!'
            },
            {
                title: 'Create Your Character',
                text: 'Choose your race, customize your appearance, and set your stats. Don\'t worry - you can always change things later!'
            },
            {
                title: 'Ready to Play!',
                text: 'Use WASD or arrow keys to move, click to interact, and explore the world. Have fun!'
            }
        ];
    }

    setupCharacterPreviewControls() {
        // Toggle auto-rotation
        const toggleAutoRotateBtn = document.getElementById('toggleAutoRotate');
        if (toggleAutoRotateBtn && this.characterPreview) {
            toggleAutoRotateBtn.addEventListener('click', () => {
                this.characterPreview.autoRotate = !this.characterPreview.autoRotate;
                toggleAutoRotateBtn.classList.toggle('active', this.characterPreview.autoRotate);
            });
            // Set initial state
            toggleAutoRotateBtn.classList.add('active'); // Auto-rotate enabled by default
        }

        // Reset camera
        const resetCameraBtn = document.getElementById('resetCamera');
        if (resetCameraBtn && this.characterPreview) {
            resetCameraBtn.addEventListener('click', () => {
                this.characterPreview.targetZoom = 1.0;
                this.characterPreview.zoomLevel = 1.0;
                this.characterPreview.targetCameraAngleY = 0;
                this.characterPreview.cameraAngleY = 0;
                this.characterPreview.autoRotate = true;
                if (toggleAutoRotateBtn) toggleAutoRotateBtn.classList.add('active');
            });
        }
    }

    setupEventListeners() {
        // Landing page buttons
        const signUpButton = document.getElementById('signUpButton');
        if (signUpButton) {
            signUpButton.addEventListener('click', () => {
                this.hideLandingPage();
                // Small delay for smooth transition, then show account creation
                setTimeout(() => {
                    this.showCreateAccountScreen();
                }, 800);
            });
        }

        const signInButton = document.getElementById('signInButton');
        if (signInButton) {
            signInButton.addEventListener('click', () => {
                this.hideLandingPage();
                this.showLoginScreen();
            });
        }

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

        // Onboarding flow (WoW-style tutorial)
        const skipOnboardingBtn = document.getElementById('skipOnboardingButton');
        const nextOnboardingBtn = document.getElementById('nextOnboardingButton');
        if (skipOnboardingBtn) {
            skipOnboardingBtn.addEventListener('click', () => {
                this.skipOnboarding();
            });
        }
        if (nextOnboardingBtn) {
            nextOnboardingBtn.addEventListener('click', () => {
                this.nextOnboardingStep();
            });
        }

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

        // Race selection (WoW-style)
        document.querySelectorAll('.wow-race-item').forEach(button => {
            button.addEventListener('click', async () => {
                // Remove selected class from all
                document.querySelectorAll('.wow-race-item').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedRace = button.dataset.race;

                console.log(`Race selected: ${this.selectedRace}`);

                // Update race-specific features UI
                this.updateRaceSpecificFeatures();

                // Apply stats based on user role
                if (this.userRole === 'admin') {
                    // Admin users keep max level stats (don't change on race selection)
                    const healthStat = document.getElementById('healthStat');
                    const strengthStat = document.getElementById('strengthStat');
                    const magicStat = document.getElementById('magicStat');
                    const speedStat = document.getElementById('speedStat');

                    if (healthStat) {
                        healthStat.value = 1000;
                        const healthValue = document.getElementById('healthValue');
                        if (healthValue) healthValue.textContent = 1000;
                    }
                    if (strengthStat) {
                        strengthStat.value = 500;
                        const strengthValue = document.getElementById('strengthValue');
                        if (strengthValue) strengthValue.textContent = 500;
                    }
                    if (magicStat) {
                        magicStat.value = 800;
                        const magicValue = document.getElementById('magicValue');
                        if (magicValue) magicValue.textContent = 800;
                    }
                    if (speedStat) {
                        speedStat.value = 500;
                        const speedValue = document.getElementById('speedValue');
                        if (speedValue) speedValue.textContent = 500;
                    }
                } else {
                    // Regular users get race-specific default stats
                    const raceStats = this.getRaceDefaultStats(this.selectedRace);
                    const healthStat = document.getElementById('healthStat');
                    const strengthStat = document.getElementById('strengthStat');
                    const magicStat = document.getElementById('magicStat');
                    const speedStat = document.getElementById('speedStat');

                    if (healthStat) {
                        healthStat.value = raceStats.health;
                        const healthValue = document.getElementById('healthValue');
                        if (healthValue) healthValue.textContent = raceStats.health;
                    }
                    if (strengthStat) {
                        strengthStat.value = raceStats.strength;
                        const strengthValue = document.getElementById('strengthValue');
                        if (strengthValue) strengthValue.textContent = raceStats.strength;
                    }
                    if (magicStat) {
                        magicStat.value = raceStats.magic;
                        const magicValue = document.getElementById('magicValue');
                        if (magicValue) magicValue.textContent = raceStats.magic;
                    }
                    if (speedStat) {
                        speedStat.value = raceStats.speed;
                        const speedValue = document.getElementById('speedValue');
                        if (speedValue) speedValue.textContent = raceStats.speed;
                    }
                }

                await this.updatePreview();
            });
        });

        // Gender selection (WoW-style)
        document.querySelectorAll('.wow-gender-icon').forEach(button => {
            button.addEventListener('click', async () => {
                // Remove selected class from all
                document.querySelectorAll('.wow-gender-icon').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedGender = button.dataset.gender;

                console.log(`Gender selected: ${this.selectedGender}`);
                await this.updatePreview();
            });
        });

        // Class selection (WoW-style) - Only 3 starter classes: Warrior, Mage, Healer
        this.selectedClass = 'warrior'; // Default class
        this.selectedClassRank = null; // Default class rank (null = base class)
        document.querySelectorAll('.wow-class-item').forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected class from all
                document.querySelectorAll('.wow-class-item').forEach(b => b.classList.remove('selected'));
                // Add to clicked
                button.classList.add('selected');
                this.selectedClass = button.dataset.class;
                console.log(`Class selected: ${this.selectedClass}`);

                // Show class rank dropdown for admin users
                if (this.userRole === 'admin') {
                    this.showClassRankDropdown(this.selectedClass);
                } else {
                    this.hideClassRankDropdown();
                }

                // Update character preview to show class equipment
                if (this.characterPreview) {
                    this.updateCharacterPreview();
                }
            });
        });

        // Character type selection
        this.characterType = 'new'; // Default: New Level 1
        document.querySelectorAll('.wow-type-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.wow-type-button').forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');
                this.characterType = button.dataset.type;
                console.log(`Character type selected: ${this.characterType}`);
            });
        });

        // Save button is now in the footer (replaced customize button)
        // The saveCharacterButton event listener is already set up below

        // Back button
        const backBtn = document.getElementById('wowBackButton');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showMainMenu();
            });
        }

        // More Info button
        const moreInfoBtn = document.getElementById('wowMoreInfoButton');
        if (moreInfoBtn) {
            moreInfoBtn.addEventListener('click', () => {
                alert('Character Creation Info:\n\n• Choose your Race (Alliance or Horde)\n• Select your Class\n• Customize your appearance\n• Set your character stats\n\nYou can change your appearance later in the game!');
            });
        }

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
        document.getElementById('hairColor').addEventListener('input', async () => {
            await this.updatePreview();
        });

        // Eye color change (WoW feature)
        document.getElementById('eyeColor').addEventListener('input', async () => {
            await this.updatePreview();
        });

        // Randomize name button (WoW feature)
        const randomizeBtn = document.getElementById('randomizeNameButton');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.randomizeCharacterName();
            });
        }

        // Race-specific features slider
        this.setupSliderControls('raceFeatures', 'raceFeaturesPrev', 'raceFeaturesNext', 'raceFeaturesValue');
        document.getElementById('raceFeatures').addEventListener('input', async (e) => {
            document.getElementById('raceFeaturesValue').textContent = parseInt(e.target.value) + 1;
            await this.updatePreview();
        });

        // Character creation - Save button (triggered from customization panel or footer)
        const saveBtn = document.getElementById('saveCharacterButton');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCharacter();
            });
        }

        // Also allow saving via Enter key in name input
        const nameInput = document.getElementById('characterName');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveCharacter();
                }
            });
        }

        const cancelBtn = document.getElementById('cancelCreationButton');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.showMainMenu();
            });
        }

        // Save button in customization panel
        const customSaveBtn = document.getElementById('wowCustomSaveButton');
        if (customSaveBtn) {
            customSaveBtn.addEventListener('click', () => {
                this.saveCharacter();
            });
        }

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

        // Instructions button in settings menu
        const instructionsButton = document.getElementById('instructionsButton');
        if (instructionsButton) {
            instructionsButton.addEventListener('click', () => {
                this.showInstructionsModal();
            });
        }

        // Character selection button in settings menu
        const characterSelectButtonSettings = document.getElementById('characterSelectButtonSettings');
        if (characterSelectButtonSettings) {
            characterSelectButtonSettings.addEventListener('click', () => {
                this.returnToCharacterSelection();
            });
        }

        // Logout button in settings menu
        const logoutButtonFromSettings = document.getElementById('logoutButton');
        if (logoutButtonFromSettings) {
            logoutButtonFromSettings.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Close instructions modal button
        const closeInstructionsButton = document.getElementById('closeInstructionsButton');
        if (closeInstructionsButton) {
            closeInstructionsButton.addEventListener('click', () => {
                this.hideInstructionsModal();
            });
        }

        // Close instructions modal when clicking outside
        const instructionsModal = document.getElementById('instructionsModal');
        if (instructionsModal) {
            instructionsModal.addEventListener('click', (e) => {
                if (e.target === instructionsModal) {
                    this.hideInstructionsModal();
                }
            });
        }

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
            // ESC to close menus and modals
            if (e.key === 'Escape') {
                // Close instructions modal if open
                const instructionsModal = document.getElementById('instructionsModal');
                if (instructionsModal && instructionsModal.style.display !== 'none') {
                    this.hideInstructionsModal();
                    return;
                }
                // Close other menus
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

            // Store username for display (always, regardless of remember checkbox)
            localStorage.setItem('fantasy3DUsername', username);

            // Store user role if present
            if (response.user && response.user.role) {
                this.userRole = response.user.role;
                localStorage.setItem('fantasy3DUserRole', response.user.role);
            } else if (response.role) {
                this.userRole = response.role;
                localStorage.setItem('fantasy3DUserRole', response.role);
            } else {
                this.userRole = 'user';
                localStorage.setItem('fantasy3DUserRole', 'user');
            }

            // Store remember preference
            if (remember) {
                localStorage.setItem('fantasy3DRemember', 'true');
            } else {
                localStorage.removeItem('fantasy3DRemember');
            }

            // Clear logged out flag since user just logged in
            localStorage.removeItem('fantasy3DLoggedOut');

            // Ensure token is stored (should already be done by authAPI.login)
            const { getToken, setToken } = await import('./api/client.js');
            if (response.token) {
                setToken(response.token);
                console.log('✅ Token stored in localStorage');
            }

            // Verify token was actually stored
            const storedToken = getToken();
            if (!storedToken) {
                console.error('❌ Token was not stored! This is a critical error.');
                throw new Error('Failed to store authentication token. Please try again.');
            }

            console.log('✅ Login successful! Token stored:', storedToken.substring(0, 20) + '...');
            console.log('✅ User will stay logged in on page refresh');

            // Check for LocalStorage characters to migrate
            await this.checkForLocalStorageMigration();

            // Hide login screen with WoW transition and show main menu
            this.hideLoginScreen(true);
            // showMainMenu will be called after transition completes
            setTimeout(() => {
                this.showMainMenu();
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            // Re-enable button
            loginButton.disabled = false;
            loginButton.textContent = 'LOGIN';
        }
    }

    async showLandingPage() {
        const landingPage = document.getElementById('landingPage');
        if (landingPage) {
            landingPage.classList.remove('hidden');
            landingPage.style.display = 'flex';
            // Reset animation to fadeIn
            landingPage.style.animation = 'fadeIn 1s ease-in';

            // Animate stats counter
            this.animateStats();
        }
    }

    hideLandingPage() {
        const landingPage = document.getElementById('landingPage');
        if (landingPage) {
            landingPage.style.animation = 'fadeOut 0.8s ease-out forwards';
            setTimeout(() => {
                landingPage.classList.add('hidden');
                landingPage.style.display = 'none';
            }, 800);
        }
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const updateStat = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateStat);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            };

            updateStat();
        });
    }

    showLoginScreen() {
        // Hide landing page if visible
        this.hideLandingPage();

        // Show login screen with delay for smooth transition
        setTimeout(() => {
            document.getElementById('loginScreen').classList.remove('hidden');
            // Load saved username if exists
            const savedUsername = localStorage.getItem('fantasy3DUsername');
            const remember = localStorage.getItem('fantasy3DRemember') === 'true';

            if (savedUsername) {
                document.getElementById('usernameInput').value = savedUsername;
                document.getElementById('rememberCheckbox').checked = remember;
            } else {
                // Clear checkbox if no saved username
                document.getElementById('rememberCheckbox').checked = false;
            }
        }, 800);
    }

    /**
     * Check if user is already logged in and auto-login if valid
     */
    async checkAutoLogin() {
        console.log('🔍 Checking for auto-login...');

        // Check if user explicitly logged out (don't auto-login)
        const loggedOut = localStorage.getItem('fantasy3DLoggedOut');
        if (loggedOut === 'true') {
            console.log('❌ User explicitly logged out, skipping auto-login');
            return false;
        }

        const token = getToken();
        if (!token) {
            console.log('❌ No token found in localStorage, showing login screen');
            return false;
        }

        console.log('✅ Token found:', token.substring(0, 20) + '...');

        try {
            // Verify token is still valid
            console.log('🔐 Verifying token...');
            const { verifyToken } = await import('./api/auth.js');
            const userData = await verifyToken();

            // The verify endpoint returns { userId, username, role } directly, not nested in user
            const username = userData?.username || userData?.user?.username;
            const role = userData?.role || userData?.user?.role || 'user';

            if (userData && username) {
                // Token is valid, auto-login successful
                console.log('✅ Auto-login successful for user:', username);

                // Store username for display
                localStorage.setItem('fantasy3DUsername', username);

                // Store user role
                this.userRole = role;
                localStorage.setItem('fantasy3DUserRole', role);

                // Clear logged out flag since we successfully auto-logged in
                localStorage.removeItem('fantasy3DLoggedOut');

                // Check for LocalStorage characters to migrate
                await this.checkForLocalStorageMigration();

                // Hide login screen (no transition for auto-login)
                this.hideLoginScreen(false);

                // Show main menu
                this.showMainMenu();

                return true;
            } else {
                console.error('❌ Auto-login failed: Invalid user data returned from verifyToken');
                // Clear invalid token
                const { removeToken } = await import('./api/client.js');
                removeToken();
                localStorage.removeItem('fantasy3DUsername');
                return false;
            }
        } catch (error) {
            // Token is invalid or expired, clear it
            console.error('❌ Auto-login failed:', error.message);
            console.error('Error details:', error);
            const { removeToken } = await import('./api/client.js');
            removeToken();
            localStorage.removeItem('fantasy3DUsername');
            // Don't set logged out flag - just clear the invalid token
            return false;
        }
    }

    hideLoginScreen(useTransition = false) {
        const loginScreen = document.getElementById('loginScreen');
        const gameCanvas = document.getElementById('gameCanvas');

        if (useTransition) {
            // Trigger WoW-style transition animation
            this.playWowTransition(() => {
                // After transition completes, hide login screen
                loginScreen.classList.add('hidden');
                loginScreen.classList.remove('transitioning');

                // Fade in game canvas
                if (gameCanvas) {
                    gameCanvas.classList.add('fadeIn');
                }
            });
        } else {
            // Simple hide without transition
            loginScreen.classList.add('hidden');
        }
    }

    /**
     * Plays a WoW-style portal transition animation
     * @param {Function} callback - Called when transition completes
     */
    playWowTransition(callback) {
        const loginScreen = document.getElementById('loginScreen');
        const gameContainer = document.getElementById('gameContainer');

        if (!loginScreen) {
            if (callback) callback();
            return;
        }

        // Add transitioning class to trigger CSS animation
        loginScreen.classList.add('transitioning');

        // Create portal overlay effect
        const overlay = document.createElement('div');
        overlay.className = 'wow-transition-overlay';
        document.body.appendChild(overlay);

        // Create magical particles
        this.createWowParticles();

        // Remove overlay and trigger callback after animation
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 1500); // Match animation duration
    }

    /**
     * Creates magical particle effects during transition
     */
    createWowParticles() {
        const particleCount = 30;
        const colors = [
            'rgba(139, 92, 246, 0.8)',  // Purple
            'rgba(74, 144, 226, 0.8)',  // Blue
            'rgba(255, 215, 0, 0.8)',   // Gold
            'rgba(255, 255, 255, 0.6)'  // White
        ];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'wow-particle';

            // Random position around center
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 100 + Math.random() * 200;
            const startX = window.innerWidth / 2 + Math.cos(angle) * 50;
            const startY = window.innerHeight / 2 + Math.sin(angle) * 50;

            // Random end position
            const endX = (Math.random() - 0.5) * window.innerWidth;
            const endY = (Math.random() - 0.5) * window.innerHeight - 100;

            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.setProperty('--particle-x', endX + 'px');
            particle.style.setProperty('--particle-y', endY + 'px');

            // Random delay for staggered effect
            particle.style.animationDelay = (Math.random() * 0.5) + 's';

            document.body.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2500);
        }
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
                    const loginResponse = await authAPI.login(username, password);

                    // Store username for display
                    localStorage.setItem('fantasy3DUsername', username);

                    // Store user role (new users default to 'user')
                    this.userRole = loginResponse.user?.role || loginResponse.role || 'user';
                    localStorage.setItem('fantasy3DUserRole', this.userRole);

                    // Clear logged out flag since user just registered and logged in
                    localStorage.removeItem('fantasy3DLoggedOut');

                    // Ensure token is stored
                    if (loginResponse.token) {
                        const { setToken } = await import('./api/client.js');
                        setToken(loginResponse.token);
                    }

                    console.log('✅ Registration and login successful. User will stay logged in on refresh.');

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
        // Login screen should already be hidden by this point
        const mainMenu = document.getElementById('mainMenu');
        mainMenu.classList.remove('hidden');
        mainMenu.style.display = 'flex';

        // Load user role from localStorage if not already set
        if (!this.userRole || this.userRole === 'user') {
            const storedRole = localStorage.getItem('fantasy3DUserRole');
            if (storedRole) {
                this.userRole = storedRole;
            }
        }

        // Update username display
        this.updateMainMenuUsername();

        // Check if we should show onboarding (only for new users)
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        const hasCharacters = localStorage.getItem('fantasy3DCharacters') || getToken();
        if (!hasSeenOnboarding && !hasCharacters) {
            // Small delay to let menu render first
            setTimeout(() => {
                this.showOnboarding();
            }, 500);
        }
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

    async handleLogout() {
        console.log('User logging out...');

        // Close all menus
        this.closeAllMenus();

        // Stop the game if running
        if (this.game && this.game.character) {
            // Clean up game state
            if (this.game.minimap) {
                this.game.minimap = null;
            }
            if (this.game.controls) {
                this.game.controls = null;
            }
            if (this.game.character) {
                this.game.character = null;
            }
        }

        // Set logged out flag to prevent auto-login
        localStorage.setItem('fantasy3DLoggedOut', 'true');

        // Clear token
        const { removeToken } = await import('./api/client.js');
        removeToken();

        // Clear username
        localStorage.removeItem('fantasy3DUsername');

        console.log('✅ Logged out. User will need to log in again on next visit.');

        // Hide all menus and show landing page
        this.hideAllMenus();
        this.hideLoginScreen();
        this.showLandingPage();

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

        // Update server population to 0 (no players in game)
        this.updateServerPopulation(0);

        // Get all elements we need
        const placeholder = document.getElementById('characterPreviewPlaceholder');
        const canvas = document.getElementById('characterSelectionPreviewCanvas');
        const infoPanel = document.getElementById('wowCharacterInfo');
        const enterWorldBtn = document.getElementById('enterWorldButton');
        const deleteBtn = document.getElementById('deleteCharacterButton');

        // Reset preview placeholder
        if (placeholder) placeholder.style.display = 'flex';
        if (canvas) canvas.style.display = 'none';

        // Clear any selected character cards (WoW-style)
        document.querySelectorAll('.wow-character-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Hide character info panel and buttons
        if (infoPanel) infoPanel.classList.add('hidden');
        if (enterWorldBtn) enterWorldBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';

        this.selectedCharacterIndex = null;
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

        // Setup character preview controls
        this.setupCharacterPreviewControls();

        // Set default race selection (WoW-style)
        this.selectedRace = 'human';
        document.querySelectorAll('.wow-race-item').forEach(b => b.classList.remove('selected'));
        const humanRace = document.querySelector('.wow-race-item[data-race="human"]');
        if (humanRace) humanRace.classList.add('selected');

        // Set default gender selection (WoW-style)
        this.selectedGender = 'male';
        document.querySelectorAll('.wow-gender-icon').forEach(b => b.classList.remove('selected'));
        const maleGender = document.getElementById('genderMale');
        if (maleGender) maleGender.classList.add('selected');

        // Set default class selection (Warrior as first starter class)
        this.selectedClass = 'warrior';
        this.selectedClassRank = null;
        document.querySelectorAll('.wow-class-item').forEach(b => b.classList.remove('selected'));
        const warriorClass = document.querySelector('.wow-class-item[data-class="warrior"]');
        if (warriorClass) warriorClass.classList.add('selected');

        // Show/hide class rank dropdown for admin users
        if (this.userRole === 'admin') {
            this.showClassRankDropdown(this.selectedClass);
        } else {
            this.hideClassRankDropdown();
        }

        // Set default character type
        this.characterType = 'new';
        document.querySelectorAll('.wow-type-button').forEach(b => b.classList.remove('selected'));
        const newType = document.getElementById('charTypeNew');
        if (newType) newType.classList.add('selected');

        // Hide customization panel by default
        const customPanel = document.getElementById('wowCustomizationPanel');
        if (customPanel) customPanel.classList.add('hidden');

        // Update race-specific features UI
        this.updateRaceSpecificFeatures();

        // Reset form to defaults
        document.getElementById('characterName').value = '';
        document.getElementById('hairColor').value = '#8B4513';
        document.getElementById('eyeColor').value = '#4A90E2';
        document.getElementById('hairStyle').value = 0;
        document.getElementById('hairStyleValue').textContent = '1';
        document.getElementById('faceType').value = 0;
        document.getElementById('faceTypeValue').textContent = '1';
        document.getElementById('facialFeatures').value = 0;
        document.getElementById('facialFeaturesValue').textContent = '1';
        document.getElementById('raceFeatures').value = 0;
        document.getElementById('raceFeaturesValue').textContent = '0';
        document.getElementById('eyeColor').value = '#4A90E2';
        document.getElementById('skinTone').value = 0.5;
        document.getElementById('skinToneValue').textContent = '0.5';
        document.getElementById('bodyShape').value = 0.5;
        document.getElementById('bodyShapeValue').textContent = '0.5';

        // Apply stats based on user role
        if (this.userRole === 'admin') {
            // Admin users get max level stats
            document.getElementById('healthStat').value = 1000;
            document.getElementById('healthValue').textContent = 1000;
            document.getElementById('strengthStat').value = 500;
            document.getElementById('strengthValue').textContent = 500;
            document.getElementById('magicStat').value = 800;
            document.getElementById('magicValue').textContent = 800;
            document.getElementById('speedStat').value = 500;
            document.getElementById('speedValue').textContent = 500;
        } else {
            // Regular users get race-specific default stats
            const raceStats = this.getRaceDefaultStats(this.selectedRace);
            document.getElementById('healthStat').value = raceStats.health;
            document.getElementById('healthValue').textContent = raceStats.health;
            document.getElementById('strengthStat').value = raceStats.strength;
            document.getElementById('strengthValue').textContent = raceStats.strength;
            document.getElementById('magicStat').value = raceStats.magic;
            document.getElementById('magicValue').textContent = raceStats.magic;
            document.getElementById('speedStat').value = raceStats.speed;
            document.getElementById('speedValue').textContent = raceStats.speed;
        }

        // Check if this is a new player and show tip (WoW-style)
        this.checkAndShowNewPlayerTip();

        // Update preview with initial values - use setTimeout to ensure canvas is visible
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            setTimeout(async () => {
                console.log('Initializing character preview...');
                await this.updatePreview();
            }, 300);
        });
    }

    // Check if user is new and show helpful tip (WoW character creation pattern)
    checkAndShowNewPlayerTip() {
        const hasCreatedCharacter = localStorage.getItem('hasCreatedCharacter');
        const tipElement = document.getElementById('newPlayerTip');

        if (!hasCreatedCharacter && tipElement) {
            // Show tip for new players
            tipElement.style.display = 'block';
        } else if (tipElement) {
            // Hide for returning players
            tipElement.style.display = 'none';
        }
    }

    // Onboarding flow (WoW-style tutorial system)
    showOnboarding() {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding) {
            return; // Skip if already seen
        }

        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            this.onboardingStep = 0;
            this.updateOnboardingDisplay();
            overlay.style.display = 'flex';
        }
    }

    updateOnboardingDisplay() {
        const title = document.getElementById('onboardingTitle');
        const text = document.getElementById('onboardingText');
        const nextBtn = document.getElementById('nextOnboardingButton');
        const progressDots = document.querySelectorAll('.onboarding-dot');

        if (!title || !text || !nextBtn) return;

        const step = this.onboardingSteps[this.onboardingStep];
        if (step) {
            title.textContent = step.title;
            text.textContent = step.text;
        }

        // Update button text
        if (this.onboardingStep === this.onboardingSteps.length - 1) {
            nextBtn.textContent = 'Start Playing';
        } else {
            nextBtn.textContent = 'Next';
        }

        // Update progress dots
        progressDots.forEach((dot, index) => {
            if (index === this.onboardingStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    nextOnboardingStep() {
        this.onboardingStep++;
        if (this.onboardingStep >= this.onboardingSteps.length) {
            // Completed onboarding
            this.skipOnboarding();
        } else {
            this.updateOnboardingDisplay();
        }
    }

    skipOnboarding() {
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            localStorage.setItem('hasSeenOnboarding', 'true');
        }
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
        if (!this.characterPreview) {
            console.error('Character preview not initialized!');
            return;
        }

        const hairColor = document.getElementById('hairColor')?.value || '#8B4513';
        const eyeColor = document.getElementById('eyeColor')?.value || '#4A90E2';
        const skinTone = parseFloat(document.getElementById('skinTone')?.value || 0.5);
        const faceType = parseInt(document.getElementById('faceType')?.value || 0);
        const hairStyle = parseInt(document.getElementById('hairStyle')?.value || 0);
        const facialFeatures = parseInt(document.getElementById('facialFeatures')?.value || 0);
        const raceFeatures = parseInt(document.getElementById('raceFeatures')?.value || 0);

        console.log('Updating character preview:', {
            race: this.selectedRace,
            gender: this.selectedGender,
            hairColor,
            skinTone,
            faceType,
            hairStyle
        });

        try {
            await this.characterPreview.updateCharacter(
                this.selectedRace || 'human',
                this.selectedGender || 'male',
                hairColor,
                skinTone,
                faceType,
                hairStyle,
                facialFeatures,
                eyeColor,
                raceFeatures,
                this.selectedClass || null,
                this.selectedClassRank || null
            );
            console.log('Character preview updated successfully');
        } catch (error) {
            console.error('Error updating character preview:', error);
        }
    }

    /**
     * Wrapper method for updating character preview (called from event listeners)
     */
    async updateCharacterPreview() {
        await this.updatePreview();
    }

    /**
     * Randomizes character name (WoW feature)
     */
    randomizeCharacterName() {
        const nameInput = document.getElementById('characterName');
        const firstNameList = [
            'Aelric', 'Bran', 'Caelum', 'Dravin', 'Eldric', 'Fenris', 'Gareth', 'Hawthorn',
            'Ivor', 'Jareth', 'Kael', 'Lorin', 'Marius', 'Nolan', 'Orin', 'Perrin',
            'Quinn', 'Roran', 'Soren', 'Theron', 'Ulric', 'Valen', 'Wren', 'Xander',
            'Zephyr', 'Alara', 'Brienne', 'Celeste', 'Dara', 'Elara', 'Fiona', 'Gwen',
            'Hazel', 'Iris', 'Jade', 'Kira', 'Luna', 'Mara', 'Nyx', 'Opal'
        ];

        const lastNameList = [
            'Stoneheart', 'Shadowbane', 'Brightblade', 'Stormwind', 'Ironforge',
            'Moonwhisper', 'Dawnbreaker', 'Nightshade', 'Goldleaf', 'Silverwing',
            'Darkthorn', 'Lightbringer', 'Firebrand', 'Icewind', 'Starweaver',
            'Thunderclap', 'Frostweaver', 'Emberheart', 'Willowbrook', 'Ravenwood'
        ];

        const firstName = firstNameList[Math.floor(Math.random() * firstNameList.length)];
        const lastName = lastNameList[Math.floor(Math.random() * lastNameList.length)];
        const randomName = `${firstName} ${lastName}`;

        nameInput.value = randomName;
    }

    /**
     * Updates race-specific features UI based on selected race (WoW feature)
     */
    updateRaceSpecificFeatures() {
        const label = document.getElementById('raceFeaturesLabel');
        const labelText = document.getElementById('raceFeaturesLabelText');
        const typeText = document.getElementById('raceFeaturesType');
        const container = document.getElementById('raceFeaturesContainer');

        if (!label || !container) return;

        const raceFeatures = {
            human: { label: 'Tattoos', show: true },
            elf: { label: 'Markings', show: true },
            dwarf: { label: 'Beard Style', show: true },
            demon: { label: 'Horn Style', show: true }
        };

        const feature = raceFeatures[this.selectedRace];
        if (feature && feature.show) {
            label.style.display = 'block';
            container.style.display = 'block';
            labelText.textContent = `${this.selectedRace.charAt(0).toUpperCase() + this.selectedRace.slice(1)} Features`;
            typeText.textContent = feature.label;
        } else {
            label.style.display = 'none';
            container.style.display = 'none';
        }
    }

    showHUD() {
        document.getElementById('hud').style.display = 'block';
        document.getElementById('settingsButton').style.display = 'flex';
        document.getElementById('skillsSection').style.display = 'flex';
        document.getElementById('inventoryButton').style.display = 'flex';
        document.getElementById('minimapContainer').style.display = 'block';

        // Ensure game canvas is visible
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.classList.add('fadeIn');
            gameCanvas.style.opacity = '1'; // Force visible immediately
        }

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
        // Hide landing page
        const landingPage = document.getElementById('landingPage');
        if (landingPage) {
            landingPage.style.display = 'none';
            landingPage.classList.add('hidden');
        }

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
        this.hideInstructionsModal();
    }

    showInstructionsModal() {
        const instructionsModal = document.getElementById('instructionsModal');
        if (instructionsModal) {
            instructionsModal.style.display = 'flex';
            // Close settings menu when opening instructions
            this.toggleSettings();
        }
    }

    hideInstructionsModal() {
        const instructionsModal = document.getElementById('instructionsModal');
        if (instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    }

    returnToCharacterSelection() {
        // Close settings menu
        this.closeAllMenus();

        // Hide game canvas
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.display = 'none';
            gameCanvas.style.opacity = '0';
        }

        // Stop the game if running
        if (this.game && this.game.character) {
            // Clean up game state
            if (this.game.minimap) {
                this.game.minimap = null;
            }
            if (this.game.controls) {
                this.game.controls = null;
            }
            if (this.game.character) {
                this.game.character = null;
            }
        }

        // Show character selection screen
        this.showCharacterSelection();
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
        if (!list) {
            console.error('Character list container not found');
            return;
        }

        list.innerHTML = '';

        const characters = await this.getAllCharacters();

        // Update character slots display
        const slotsUsed = document.getElementById('wowSlotsUsed');
        if (slotsUsed) {
            slotsUsed.textContent = characters.length;
        }

        if (characters.length === 0) {
            list.innerHTML = `
                <div class="wow-empty-state">
                    <div class="wow-empty-state-icon"><i class="fas fa-user-circle"></i></div>
                    <h3>No Characters Yet</h3>
                    <p>Create your first character to begin your adventure!</p>
                    <button class="wow-create-character-btn" id="createFirstCharacterButton" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Create Your First Character
                    </button>
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

        // Store characters for later use
        this.characters = characters;

        characters.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'wow-character-card';
            card.dataset.characterIndex = index;
            card.dataset.characterId = char.id || char._id || index; // Store API ID if available

            const raceIcon = {
                human: '<i class="fas fa-user"></i>',
                elf: '<i class="fas fa-leaf"></i>',
                dwarf: '<i class="fas fa-hammer"></i>',
                demon: '<i class="fas fa-fire"></i>'
            }[char.race] || '<i class="fas fa-user"></i>';

            const raceName = char.race ? char.race.charAt(0).toUpperCase() + char.race.slice(1) : 'Human';
            const genderIcon = char.gender === 'female' ? '<i class="fas fa-venus"></i>' : '<i class="fas fa-mars"></i>';
            const level = char.stats?.level || char.level || 1;
            const className = char.class || 'Warrior';

            card.innerHTML = `
                <button class="wow-character-card-delete" data-character-index="${index}" aria-label="Delete character">
                    <i class="fas fa-times"></i>
                </button>
                <div class="wow-character-card-icon">${raceIcon}</div>
                <div class="wow-character-card-info">
                    <div class="wow-character-card-name">${char.name || 'Unnamed Character'}</div>
                    <div class="wow-character-card-details">
                        <span class="wow-character-card-level">Level ${level}</span>
                        <span>${raceName}</span>
                        <span>${genderIcon}</span>
                        <span>${className}</span>
                    </div>
                </div>
            `;

            // Add click handler for card selection (but not when clicking delete button)
            card.addEventListener('click', (e) => {
                // Don't select if clicking the delete button
                if (!e.target.closest('.wow-character-card-delete')) {
                    this.selectCharacter(index);
                }
            });

            // Add click handler for delete button
            const deleteButton = card.querySelector('.wow-character-card-delete');
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
                    console.log('No token and no local characters found');
                    return [];
                }
                const localChars = JSON.parse(saved);
                console.log('Loaded characters from localStorage (no token):', localChars.length, 'characters');
                return localChars;
            } catch (error) {
                console.error('Error loading characters from localStorage:', error);
                return [];
            }
        }

        // Fetch from API (user is authenticated)
        try {
            console.log('Fetching characters from API for logged-in user...');
            const characters = await charactersAPI.getCharacters();
            console.log('✅ Loaded characters from API:', characters.length, 'characters');

            if (characters && characters.length > 0) {
                // Log character details for debugging
                characters.forEach((char, idx) => {
                    console.log(`  Character ${idx + 1}: ${char.name} (${char.race}, ${char.gender})`);
                });
            } else {
                console.log('No characters found in database for this user');
            }

            return characters || [];
        } catch (error) {
            console.error('❌ Error loading characters from API:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });

            // Only fallback to LocalStorage if it's a network/server error, not auth error
            if (error.message && !error.message.includes('401') && !error.message.includes('Unauthorized')) {
                try {
                    const saved = localStorage.getItem('fantasy3DCharacters');
                    if (!saved) {
                        return [];
                    }
                    const localChars = JSON.parse(saved);
                    console.log('⚠️ Fallback: Loaded characters from localStorage:', localChars.length, 'characters');
                    return localChars;
                } catch (localError) {
                    console.error('Error loading characters from localStorage:', localError);
                    return [];
                }
            }

            // For auth errors, return empty array (user needs to log in)
            return [];
        }
    }

    async saveCharacter() {
        // Get race-specific default stats
        const raceStats = this.getRaceDefaultStats(this.selectedRace);

        // Get all form values safely
        const nameInput = document.getElementById('characterName');
        const hairColorInput = document.getElementById('hairColor');
        const eyeColorInput = document.getElementById('eyeColor');
        const skinToneInput = document.getElementById('skinTone');
        const bodyShapeInput = document.getElementById('bodyShape');
        const faceTypeInput = document.getElementById('faceType');
        const hairStyleInput = document.getElementById('hairStyle');
        const facialFeaturesInput = document.getElementById('facialFeatures');
        const raceFeaturesInput = document.getElementById('raceFeatures');
        const healthStatInput = document.getElementById('healthStat');
        const strengthStatInput = document.getElementById('strengthStat');
        const magicStatInput = document.getElementById('magicStat');
        const speedStatInput = document.getElementById('speedStat');

        // Check if user is admin - if so, use max level stats
        const isAdmin = this.userRole === 'admin';
        let finalStats;

        if (isAdmin) {
            // Admin users get max level stats regardless of characterType
            finalStats = {
                level: 1000,
                health: 1000,
                maxHealth: 1000,
                strength: 500,
                magic: 800,
                speed: 500,
                defense: 100
            };
        } else {
            // Regular users get stats based on characterType
            finalStats = {
                level: this.characterType === 'new' ? 1 : (this.characterType === 'dev' ? 500 : 1),
                health: (healthStatInput && parseInt(healthStatInput.value)) || raceStats.health,
                maxHealth: (healthStatInput && parseInt(healthStatInput.value)) || raceStats.health,
                strength: (strengthStatInput && parseInt(strengthStatInput.value)) || raceStats.strength,
                magic: (magicStatInput && parseInt(magicStatInput.value)) || raceStats.magic,
                speed: (speedStatInput && parseInt(speedStatInput.value)) || raceStats.speed,
                defense: raceStats.defense
            };
        }

        const characterData = {
            name: (nameInput && nameInput.value) || 'Unnamed Character',
            race: this.selectedRace,
            gender: this.selectedGender,
            class: this.selectedClass || 'warrior',
            classRank: this.selectedClassRank || null, // Include class rank if selected
            characterType: this.characterType || 'new',
            appearance: {
                hairColor: (hairColorInput && hairColorInput.value) || '#8B4513',
                eyeColor: (eyeColorInput && eyeColorInput.value) || '#4A90E2',
                skinTone: (skinToneInput && parseFloat(skinToneInput.value)) || 0.5,
                bodyShape: (bodyShapeInput && parseFloat(bodyShapeInput.value)) || 0.5,
                faceType: (faceTypeInput && parseInt(faceTypeInput.value)) || 0,
                hairStyle: (hairStyleInput && parseInt(hairStyleInput.value)) || 0,
                facialFeatures: (facialFeaturesInput && parseInt(facialFeaturesInput.value)) || 0,
                raceFeatures: (raceFeaturesInput && parseInt(raceFeaturesInput.value)) || 0
            },
            stats: finalStats,
            equipment: {
                weapon: null,
                armor: null,
                helmet: null
            }
        };

        const saveButton = document.getElementById('saveCharacterButton');
        const originalText = saveButton ? saveButton.textContent : 'Save';
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'SAVING...';
        }

        try {
            // Check if user is authenticated
            const token = getToken();
            if (token) {
                // Save to API
                await charactersAPI.createCharacter(characterData);
                // Refresh character list to show the new character
                await this.loadCharacterList();
                this.showMainMenu();
                alert('Character saved to your account!');
            } else {
                // Fallback to LocalStorage
                const characters = await this.getAllCharacters();
                characters.push(characterData);
                localStorage.setItem('fantasy3DCharacters', JSON.stringify(characters));
                // Refresh character list to show the new character
                await this.loadCharacterList();
                this.showMainMenu();
                alert('Character saved locally! Create an account to sync across devices.');
            }

            // Mark that user has created a character (for hiding new player tips)
            localStorage.setItem('hasCreatedCharacter', 'true');
        } catch (error) {
            console.error('Error saving character:', error);
            alert('Failed to save character: ' + (error.message || 'Unknown error'));
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = originalText;
            }
        }
    }

    async selectCharacter(index) {
        // Use stored characters if available, otherwise fetch
        const characters = this.characters || await this.getAllCharacters();
        if (!characters || !characters[index]) {
            console.error('Invalid character index:', index, 'Total characters:', characters?.length || 0);
            return;
        }

        const character = characters[index];
        this.selectedCharacterIndex = index;
        this.selectedCharacter = character; // Store selected character

        console.log('Selected character:', character.name, 'at index:', index);

        // Update visual selection state (WoW-style)
        document.querySelectorAll('.wow-character-card').forEach((card, i) => {
            if (i === index) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Show character preview in selection screen (WoW-style)
        await this.showCharacterSelectionPreview(character);

        // Show "Enter World" and "Delete" buttons
        const enterWorldBtn = document.getElementById('enterWorldButton');
        const deleteBtn = document.getElementById('deleteCharacterButton');
        if (enterWorldBtn) {
            enterWorldBtn.style.display = 'flex';
            enterWorldBtn.onclick = () => this.startGameWithCharacter(index);
        }
        if (deleteBtn) {
            deleteBtn.style.display = 'flex';
            deleteBtn.onclick = () => {
                if (this.selectedCharacterIndex !== null) {
                    this.showDeleteConfirmation(this.selectedCharacterIndex, character.name || 'Unnamed Character');
                }
            };
        }
    }

    /**
     * Shows character preview in the character selection screen (WoW-style)
     * @param {Object} character - Character data to preview
     */
    async showCharacterSelectionPreview(character) {
        const placeholder = document.getElementById('characterPreviewPlaceholder');
        const canvas = document.getElementById('characterSelectionPreviewCanvas');
        const infoPanel = document.getElementById('wowCharacterInfo');

        if (!placeholder || !canvas) return;

        // Hide placeholder, show canvas and info panel
        placeholder.style.display = 'none';
        canvas.style.display = 'block';
        if (infoPanel) {
            infoPanel.classList.remove('hidden');
        }

        // Initialize or reuse CharacterPreview instance for selection screen
        if (!this.characterSelectionPreview) {
            this.characterSelectionPreview = new CharacterPreview('characterSelectionPreviewCanvas');
        }

        // Update character preview with character data
        const appearance = character.appearance || {};
        await this.characterSelectionPreview.updateCharacter(
            character.race || 'human',
            character.gender || 'male',
            appearance.hairColor || '#8B4513',
            appearance.skinTone || 0.5,
            appearance.faceType || 0,
            appearance.hairStyle || 0,
            appearance.facialFeatures || 0,
            appearance.eyeColor || '#4A90E2',
            appearance.raceFeatures || 0
        );

        // Update character info panel (WoW-style)
        if (infoPanel) {
            const nameEl = document.getElementById('wowCharacterInfoName');
            const raceEl = document.getElementById('wowCharacterInfoRace');
            const classEl = document.getElementById('wowCharacterInfoClass');
            const levelEl = document.getElementById('wowCharacterInfoLevel');
            const healthEl = document.getElementById('wowCharacterInfoHealth');
            const strengthEl = document.getElementById('wowCharacterInfoStrength');
            const magicEl = document.getElementById('wowCharacterInfoMagic');
            const speedEl = document.getElementById('wowCharacterInfoSpeed');

            if (nameEl) nameEl.textContent = character.name || 'Unnamed Character';
            if (raceEl) {
                const race = (character.race || 'Human');
                raceEl.textContent = race.charAt(0).toUpperCase() + race.slice(1);
            }
            if (classEl) {
                const className = (character.class || 'Warrior');
                classEl.textContent = className.charAt(0).toUpperCase() + className.slice(1);
            }
            if (levelEl) levelEl.textContent = character.stats?.level || character.level || 1;
            if (healthEl) healthEl.textContent = `${character.stats?.health || 100}/${character.stats?.maxHealth || 100}`;
            if (strengthEl) strengthEl.textContent = character.stats?.strength || 10;
            if (magicEl) magicEl.textContent = character.stats?.magic || 10;
            if (speedEl) speedEl.textContent = character.stats?.speed || 10;
        }
    }

    /**
     * Starts the game with the selected character
     * @param {number} index - Character index to start with
     */
    async startGameWithCharacter(index) {
        const characters = await this.getAllCharacters();
        if (characters[index]) {
            const character = characters[index];
            // Update server population to 1 (player entering game)
            this.updateServerPopulation(1);
            this.game.startGame(character);
        }
    }

    /**
     * Updates the server population display
     * @param {number} population - Number of players currently in the game
     */
    updateServerPopulation(population) {
        const populationElement = document.getElementById('serverPopulation');
        if (populationElement) {
            populationElement.textContent = population.toString();
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
            const characterId = characterToDelete.id || characterToDelete._id; // Support both id and _id

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

            // Clear selected character if it was deleted
            if (this.selectedCharacterIndex === characterIndex) {
                this.selectedCharacterIndex = null;
                this.selectedCharacter = null;

                // Reset preview
                const placeholder = document.getElementById('characterPreviewPlaceholder');
                const canvas = document.getElementById('characterSelectionPreviewCanvas');
                const infoPanel = document.getElementById('wowCharacterInfo');
                const enterWorldBtn = document.getElementById('enterWorldButton');
                const deleteBtn = document.getElementById('deleteCharacterButton');

                if (placeholder) placeholder.style.display = 'flex';
                if (canvas) canvas.style.display = 'none';
                if (infoPanel) infoPanel.classList.add('hidden');
                if (enterWorldBtn) enterWorldBtn.style.display = 'none';
                if (deleteBtn) deleteBtn.style.display = 'none';
            } else if (this.selectedCharacterIndex > characterIndex) {
                // Adjust selected index if a character before it was deleted
                this.selectedCharacterIndex--;
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
            // Update level from database (stats.level)
            const level = characterData.stats?.level || characterData.level || 1;
            const levelEl = document.getElementById('hudLevel');
            if (levelEl) {
                levelEl.textContent = `Lv. ${level.toString()}`;
            }

            // Update health bar
            const health = characterData.stats.health || 0;
            const maxHealth = characterData.stats.maxHealth || 100;
            const healthPercent = maxHealth > 0 ? (health / maxHealth) * 100 : 0;

            const healthBarFill = document.getElementById('gothicHealthBarFill');
            if (healthBarFill) {
                healthBarFill.style.width = `${healthPercent}%`;
            }

            // Update health bar text
            const healthBarText = document.getElementById('gothicHealthBarText');
            if (healthBarText) {
                healthBarText.textContent = `${health}/${maxHealth}`;
            }

            // Update mana bar (using magic stat as current, max is same as magic stat for now)
            const magic = characterData.stats.magic || 0;
            const maxMagic = characterData.stats.magic || 10; // Use magic stat as max for now
            const magicPercent = maxMagic > 0 ? (magic / maxMagic) * 100 : 0;

            const manaBarFill = document.getElementById('gothicManaBarFill');
            if (manaBarFill) {
                manaBarFill.style.width = `${magicPercent}%`;
            }

            // Update mana bar text
            const manaBarText = document.getElementById('gothicManaBarText');
            if (manaBarText) {
                manaBarText.textContent = `${magic}/${maxMagic}`;
            }

            // Update stamina bar (using speed stat as max, energy system for current)
            const speedStat = characterData.stats.speed || 100;
            let currentStamina = speedStat;
            let maxStamina = speedStat;
            if (this.game && this.game.character) {
                const energyData = this.game.character.getEnergy();
                currentStamina = energyData.current || speedStat;
                maxStamina = energyData.max || speedStat;
            }
            const staminaPercent = maxStamina > 0 ? (currentStamina / maxStamina) * 100 : 0;

            const staminaBarFill = document.getElementById('gothicStaminaBarFill');
            if (staminaBarFill) {
                staminaBarFill.style.width = `${staminaPercent}%`;
            }

            // Update stamina bar text
            const staminaBarText = document.getElementById('gothicStaminaBarText');
            if (staminaBarText) {
                staminaBarText.textContent = `${currentStamina}/${maxStamina}`;
            }

            // Update strength bar (using strength stat)
            const strength = characterData.stats.strength || 0;
            const maxStrength = characterData.stats.strength || 100; // Strength stat is both current and max
            const strengthPercent = maxStrength > 0 ? 100 : 0; // Always full since it's a stat, not a resource

            const strengthBarFill = document.getElementById('gothicStrengthBarFill');
            if (strengthBarFill) {
                strengthBarFill.style.width = `${strengthPercent}%`;
            }

            // Update strength bar text
            const strengthBarText = document.getElementById('gothicStrengthBarText');
            if (strengthBarText) {
                strengthBarText.textContent = `${strength}/${maxStrength}`;
            }
        }
    }

    updateEnergyDisplay(character) {
        if (!character) return;

        const energyData = character.getEnergy();
        const staminaPercent = energyData.max > 0 ? (energyData.current / energyData.max) * 100 : 0;

        // Update stamina bar fill
        const staminaBarFill = document.getElementById('gothicStaminaBarFill');
        if (staminaBarFill) {
            staminaBarFill.style.width = `${staminaPercent}%`;
        }

        // Update stamina bar text
        const staminaBarText = document.getElementById('gothicStaminaBarText');
        if (staminaBarText) {
            staminaBarText.textContent = `${energyData.current}/${energyData.max}`;
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

    /**
     * Shows the class rank dropdown for admin users
     * @param {string} baseClass - The base class (warrior, mage, healer)
     */
    showClassRankDropdown(baseClass) {
        const dropdown = document.getElementById('wowClassRankDropdown');
        const select = document.getElementById('classRankSelect');
        if (!dropdown || !select) return;

        dropdown.classList.remove('hidden');
        this.populateClassRankDropdown(baseClass);
    }

    /**
     * Hides the class rank dropdown
     */
    hideClassRankDropdown() {
        const dropdown = document.getElementById('wowClassRankDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        this.selectedClassRank = null;
    }

    /**
     * Populates the class rank dropdown with available ranks for the selected class
     * @param {string} baseClass - The base class (warrior, mage, healer)
     */
    populateClassRankDropdown(baseClass) {
        const select = document.getElementById('classRankSelect');
        if (!select) return;

        // Clear existing options (except the base class option)
        select.innerHTML = '<option value="">Base Class (C-Rank)</option>';

        // Define class ranks based on the Classes folder structure
        const classRanks = {
            warrior: {
                'C-Rank': ['Warrior'],
                'B-Rank': ['Knight', 'Berserker', 'Paladin', 'Thief', 'Ranger'],
                'A-Rank': ['Arch Knight', 'Hunter', 'Warlord', 'Gladiator'],
                'S-Rank': ['Assassin', 'Demon Hunter', 'Ninja', 'Samurai'],
                'SS-Rank': ['Death Knight', 'Holy Knight', 'Sword Master', 'Sword Saint', 'Blood Knight'],
                'SSS-Rank': ['Magic Swordsman', 'Dragon Knight']
            },
            mage: {
                'C-Rank': ['Mage'],
                'B-Rank': ['Battle Mage', 'Enchanter'],
                'A-Rank': ['Wizard', 'Witch', 'Warlock', 'Fire Mage', 'Water Mage', 'Wind Mage', 'Earth Mage', 'Light Mage', 'Dark Mage', 'Chronomancer'],
                'S-Rank': ['Fire Arch Mage', 'Water Arch Mage', 'Wind Arch Mage', 'Earth Arch Mage', 'Light Arch Mage', 'Dark Arch Mage'],
                'SS-Rank': ['Card Caster', 'Illusionist', 'Shaman', 'Spell Master', 'Sword Caster', 'Vampire'],
                'SSS-Rank': ['Akashic Caster', 'Omni Caster', 'Spell Breaker', 'Reality Architect']
            },
            healer: {
                'C-Rank': ['Healer'],
                'B-Rank': ['Cleric', 'Bard'],
                'A-Rank': ['Priest'],
                'S-Rank': ['Divine Priest', 'Necromancer', 'Potion Master'],
                'SS-Rank': ['Angel', 'Demon', 'Druid', 'Monk'],
                'SSS-Rank': ['Arch Angel', 'Arch Demon', 'Sage', 'Summoner', 'Avatar']
            }
        };

        const ranks = classRanks[baseClass] || {};

        // Add options grouped by rank
        Object.keys(ranks).forEach(rankName => {
            const rankClasses = ranks[rankName];
            if (rankClasses && rankClasses.length > 0) {
                // Add optgroup for this rank
                const optgroup = document.createElement('optgroup');
                optgroup.label = rankName;
                rankClasses.forEach(className => {
                    const option = document.createElement('option');
                    option.value = `${rankName}:${className}`;
                    option.textContent = `${className} (${rankName})`;
                    optgroup.appendChild(option);
                });
                select.appendChild(optgroup);
            }
        });

        // Set up event listener for rank selection if not already set up
        if (!this.classRankSelectListenerAdded) {
            select.addEventListener('change', (e) => {
                this.selectedClassRank = e.target.value || null;
                console.log(`Class rank selected: ${this.selectedClassRank}`);

                // Update character preview to show class equipment for selected rank
                if (this.characterPreview) {
                    this.updateCharacterPreview();
                }
            });
            this.classRankSelectListenerAdded = true;
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

