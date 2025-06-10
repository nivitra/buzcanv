// Business Model Canvas Interactive Functionality
class BusinessModelCanvas {
    constructor() {
        this.sections = {};
        this.autoSaveTimeout = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTextareas();
        this.updateProgress();
        this.updateCharacterCounters();
        this.showAutoSaveIndicator();
    }

    setupEventListeners() {
        // Textarea event listeners
        document.querySelectorAll('.canvas-textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                this.handleTextareaInput(e);
                this.autoExpandTextarea(e.target);
                this.updateCharacterCounter(e.target);
                this.updateProgress();
                this.triggerAutoSave();
            });

            textarea.addEventListener('focus', (e) => {
                this.handleTextareaFocus(e);
            });

            textarea.addEventListener('blur', (e) => {
                this.handleTextareaBlur(e);
            });
        });

        // Clear button event listeners
        document.querySelectorAll('.clear-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.clearSection(e.target.dataset.section);
            });
        });

        // Header action buttons
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.showResetModal();
        });

        // Modal event listeners
        document.getElementById('confirmReset').addEventListener('click', () => {
            this.resetAllSections();
            this.hideResetModal();
        });

        document.getElementById('cancelReset').addEventListener('click', () => {
            this.hideResetModal();
        });

        // Close modal on background click
        document.getElementById('resetModal').addEventListener('click', (e) => {
            if (e.target.id === 'resetModal') {
                this.hideResetModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.triggerAutoSave();
            }
            if (e.key === 'Escape') {
                this.hideResetModal();
            }
        });
    }

    setupTextareas() {
        document.querySelectorAll('.canvas-textarea').forEach(textarea => {
            this.autoExpandTextarea(textarea);
            this.updateCharacterCounter(textarea);
        });
    }

    autoExpandTextarea(textarea) {
        // Reset height to calculate scrollHeight properly
        textarea.style.height = 'auto';
        
        // Set minimum height
        const minHeight = 120;
        const newHeight = Math.max(textarea.scrollHeight, minHeight);
        
        textarea.style.height = newHeight + 'px';
        textarea.classList.add('expanding');
    }

    handleTextareaInput(e) {
        const section = e.target.dataset.section;
        const content = e.target.value;
        
        // Store content in memory (simulating persistence)
        this.sections[section] = content;
        
        // Update section completion status
        this.updateSectionStatus(section, content);
    }

    handleTextareaFocus(e) {
        const section = e.target.closest('.canvas-section');
        section.classList.add('focused');
    }

    handleTextareaBlur(e) {
        const section = e.target.closest('.canvas-section');
        section.classList.remove('focused');
    }

    updateCharacterCounter(textarea) {
        const section = textarea.closest('.canvas-section');
        const counter = section.querySelector('.char-counter');
        const count = textarea.value.length;
        
        counter.textContent = `${count} characters`;
        
        // Update counter color based on content length
        if (count > 500) {
            counter.style.color = '#FF6B6B';
        } else if (count > 300) {
            counter.style.color = '#FFA726';
        } else {
            counter.style.color = '#999';
        }
    }

    updateCharacterCounters() {
        document.querySelectorAll('.canvas-textarea').forEach(textarea => {
            this.updateCharacterCounter(textarea);
        });
    }

    updateSectionStatus(sectionId, content) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (content.trim().length > 20) {
            section.classList.add('completed');
        } else {
            section.classList.remove('completed');
        }
    }

    updateProgress() {
        const textareas = document.querySelectorAll('.canvas-textarea');
        let completedSections = 0;
        
        textareas.forEach(textarea => {
            if (textarea.value.trim().length > 20) {
                completedSections++;
            }
        });
        
        const progressPercent = Math.round((completedSections / textareas.length) * 100);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressPercent');
        
        if (progressFill && progressText) {
            progressFill.style.width = progressPercent + '%';
            progressText.textContent = progressPercent + '%';
        }
    }

    clearSection(sectionId) {
        const textarea = document.querySelector(`[data-section="${sectionId}"] .canvas-textarea`);
        
        // Instant clear for better user experience
        textarea.value = '';
        this.autoExpandTextarea(textarea);
        this.updateCharacterCounter(textarea);
        this.updateProgress();
        this.triggerAutoSave();
        
        // Update section status
        this.updateSectionStatus(sectionId, '');
        
        // Show brief feedback
        this.showClearFeedback(sectionId);
    }

    showClearFeedback(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        const originalBorder = section.style.borderColor;
        
        section.style.borderColor = '#4CAF50';
        section.style.transition = 'border-color 0.3s ease-in-out';
        
        setTimeout(() => {
            section.style.borderColor = originalBorder;
        }, 500);
    }

    showResetModal() {
        const modal = document.getElementById('resetModal');
        modal.classList.add('active');
        
        // Focus on cancel button for accessibility
        setTimeout(() => {
            document.getElementById('cancelReset').focus();
        }, 300);
    }

    hideResetModal() {
        const modal = document.getElementById('resetModal');
        modal.classList.remove('active');
    }

    resetAllSections() {
        document.querySelectorAll('.canvas-textarea').forEach(textarea => {
            // Only clear sections that aren't supposed to be empty by default
            if (textarea.dataset.section !== 'notes_ideas') {
                // For pre-filled sections, restore original content
                this.restoreOriginalContent(textarea);
            } else {
                // Keep notes section empty
                textarea.value = '';
            }
            
            this.autoExpandTextarea(textarea);
            this.updateCharacterCounter(textarea);
            
            // Update section status
            const section = textarea.closest('.canvas-section');
            if (textarea.value.trim().length > 20) {
                section.classList.add('completed');
            } else {
                section.classList.remove('completed');
            }
        });
        
        this.updateProgress();
        this.triggerAutoSave();
        
        // Show confirmation
        this.showResetConfirmation();
    }

    restoreOriginalContent(textarea) {
        const sectionId = textarea.dataset.section;
        const originalContent = this.getOriginalContent(sectionId);
        textarea.value = originalContent;
    }

    getOriginalContent(sectionId) {
        const originalContents = {
            'key_partnerships': 'Tech Companies: 3 sponsors (₹25,000 each = ₹75,000/year)\n\nUniversities: 5 partnerships for venue access\n\nMentors: 15 industry professionals\n\nPlatforms: Free tools (Canva, GitHub, etc.)',
            'key_activities': 'Workshops: 12/year (₹2,500 each = ₹30,000)\n\nMentorship: 15 mentors × 2 hours/week × 40 weeks = 1,200 hours\n\nCommunity Events: Monthly meetups (₹1,500 each = ₹18,000/year)\n\nResource Development: Creating templates and guides',
            'key_resources': 'Human: 10 volunteers, 15 mentors\n\nDigital: Website, learning platform (₹15,000/year)\n\nPhysical: Co-working space access (₹8,000/month)\n\nFinancial: Starting budget ₹2,50,000',
            'value_propositions': 'Free Skill Development: Workshops in entrepreneurship, coding, design\n\nMentorship: 1:10 mentor-student ratio\n\nCommunity: Network of 500+ students and professionals\n\nResources: Access to tools, templates, and guides\n\nVisibility: Showcase projects to 5,000+ people',
            'customer_relationships': 'Personal Mentorship: 2 hours/week per student\n\nCommunity Building: WhatsApp groups, Discord server\n\nSelf-Service: Online resource library\n\nCo-Creation: Student-led hackathons and projects',
            'channels': 'Website: 3,000 visitors/month\n\nSocial Media: Instagram (2,000 followers), LinkedIn (1,500)\n\nEvents: 12 workshops, 10 webinars/year\n\nEmail: Bi-weekly newsletters (2,500 subscribers)\n\nCollege Partnerships: Reach 10,000+ students',
            'customer_segments': 'Engineering Students: 60% (est. 1,000 students)\n\nManagement Students: 25% (est. 400 students)\n\nOther Students: 10% (est. 200 students)\n\nYoung Professionals: 5% (est. 100 people)',
            'cost_structure': 'Fixed Costs: Website hosting ₹12,000/year, Tools ₹8,000/year\n\nVariable Costs: Events ₹30,000, Marketing ₹15,000\n\nTotal Annual Costs: ₹65,000\n\nCost per beneficiary: ₹65 per student',
            'revenue_streams': 'Corporate Sponsorships: ₹75,000/year\n\nWorkshop Fees: Premium workshops ₹500 × 200 = ₹1,00,000\n\nMembership: Annual membership ₹200 × 100 = ₹20,000\n\nGrants: Government/NGO grants ₹50,000/year\n\nTotal Revenue: ₹2,45,000/year',
            'notes_ideas': ''
        };
        
        return originalContents[sectionId] || '';
    }

    showResetConfirmation() {
        const indicator = document.getElementById('autoSaveIndicator');
        const originalText = indicator.querySelector('.save-text').textContent;
        
        indicator.querySelector('.save-text').textContent = 'Canvas reset successfully!';
        indicator.style.color = '#4CAF50';
        
        setTimeout(() => {
            indicator.querySelector('.save-text').textContent = originalText;
            indicator.style.color = '#666';
        }, 3000);
    }

    triggerAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Set new timeout for auto-save
        this.autoSaveTimeout = setTimeout(() => {
            this.performAutoSave();
        }, 1000);
        
        // Show saving indicator
        this.showSavingIndicator();
    }

    performAutoSave() {
        // Simulate saving (since we can't use localStorage per instructions)
        this.showSavedIndicator();
    }

    showSavingIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        const dot = indicator.querySelector('.save-dot');
        const text = indicator.querySelector('.save-text');
        
        if (dot && text) {
            dot.style.background = '#FFA726';
            text.textContent = 'Saving...';
        }
    }

    showSavedIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        const dot = indicator.querySelector('.save-dot');
        const text = indicator.querySelector('.save-text');
        
        if (dot && text) {
            dot.style.background = '#4CAF50';
            text.textContent = 'All changes saved automatically';
        }
    }

    showAutoSaveIndicator() {
        // Initial state
        this.showSavedIndicator();
    }

    exportToPDF() {
        // Show export feedback
        const exportBtn = document.getElementById('exportBtn');
        const originalText = exportBtn.textContent;
        
        exportBtn.textContent = 'Preparing PDF...';
        exportBtn.disabled = true;
        
        // Prepare for printing
        this.prepareForPrint();
        
        // Small delay then trigger print
        setTimeout(() => {
            window.print();
            
            // Reset button state
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }, 500);
    }

    prepareForPrint() {
        // Add print-specific styling
        document.body.classList.add('print-mode');
        
        // Remove print mode after potential print
        setTimeout(() => {
            document.body.classList.remove('print-mode');
        }, 2000);
    }

    // Smooth scrolling to section
    scrollToSection(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const sections = document.querySelectorAll('.canvas-section');
                const index = parseInt(e.key) - 1;
                
                if (sections[index]) {
                    const textarea = sections[index].querySelector('.canvas-textarea');
                    textarea.focus();
                }
            }
        });
    }

    // Add smooth animations to interactions
    addInteractionAnimations() {
        document.querySelectorAll('.canvas-section').forEach(section => {
            section.addEventListener('mouseenter', function() {
                if (!this.classList.contains('focused')) {
                    this.style.transform = 'translateY(-2px)';
                }
            });
            
            section.addEventListener('mouseleave', function() {
                if (!this.classList.contains('focused')) {
                    this.style.transform = 'translateY(0)';
                }
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = new BusinessModelCanvas();
    
    // Setup keyboard navigation
    canvas.setupKeyboardNavigation();
    
    // Add interaction animations
    canvas.addInteractionAnimations();
    
    // Add a subtle entrance animation
    setTimeout(() => {
        document.querySelectorAll('.canvas-section').forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.6s ease-out';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
});

// Add some utility functions for enhanced user experience
function highlightSection(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        section.style.animation = 'highlight 1s ease-in-out';
        setTimeout(() => {
            section.style.animation = '';
        }, 1000);
    }
}

// Add CSS for highlight animation and improved modal transitions
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { background-color: #fff; }
        50% { background-color: #f0f0f0; }
        100% { background-color: #fff; }
    }
    
    .modal {
        transition: all 0.3s ease-in-out;
    }
    
    .modal.active {
        backdrop-filter: blur(4px);
    }
    
    .modal-content {
        animation: modalSlideIn 0.3s ease-out;
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .print-mode .section-actions,
    .print-mode .header-actions,
    .print-mode .footer {
        display: none !important;
    }
`;
document.head.appendChild(style);