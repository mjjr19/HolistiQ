// form-check.js - Exercise Form Check functionality for HolistiQ

class FormCheck {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error('Form check container not found:', containerSelector);
      return;
    }
    
    this.messages = [];
    this.init();
  }

  init() {
    // Create the form check UI structure
    this.container.innerHTML = `
      <div class="form-check-wrapper">
        <div class="form-check-header">
          <h2>Exercise Form Checker</h2>
          <button class="close-btn" aria-label="Close form checker">&times;</button>
        </div>
        <div class="form-check-content">
          <div class="form-check-messages" id="form-check-messages"></div>
          <div class="form-check-input-area">
            <div class="upload-container">
              <button class="upload-video-btn">Upload Video</button>
              <input type="file" id="video-upload" accept="video/*" style="display: none;">
              <div class="video-preview-container" style="display: none;"></div>
            </div>
            <div class="message-container">
              <textarea id="user-message" placeholder="Describe your exercise or ask for feedback..."></textarea>
              <button class="send-message-btn" aria-label="Send message"></button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Get references to elements
    this.messageContainer = this.container.querySelector('#form-check-messages');
    this.videoUploadBtn = this.container.querySelector('.upload-video-btn');
    this.videoInput = this.container.querySelector('#video-upload');
    this.videoPreviewContainer = this.container.querySelector('.video-preview-container');
    this.userMessageInput = this.container.querySelector('#user-message');
    this.sendMessageBtn = this.container.querySelector('.send-message-btn');
    this.closeBtn = this.container.querySelector('.close-btn');
    this.formCheckWrapper = this.container.querySelector('.form-check-wrapper');
    
    // Add event listeners
    this.videoUploadBtn.addEventListener('click', () => this.videoInput.click());
    this.videoInput.addEventListener('change', (e) => this.handleVideoUpload(e));
    this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
    this.closeBtn.addEventListener('click', () => this.hide());
    
    this.userMessageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Add welcome message
    this.addBotMessage("Hi! I'm your exercise form checker. Upload a video of your exercise, and I'll provide feedback to help improve your form.");
  }
  
  handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Clear previous preview
    this.videoPreviewContainer.innerHTML = '';
    
    // Create video preview
    const video = document.createElement('video');
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '300px';
    
    const source = document.createElement('source');
    source.src = URL.createObjectURL(file);
    source.type = file.type;
    
    video.appendChild(source);
    this.videoPreviewContainer.appendChild(video);
    this.videoPreviewContainer.style.display = 'block';
    
    // Add message about uploaded video
    this.addUserMessage(`Uploaded: ${file.name}`);
    this.addBotMessage("I've received your video! What exercise are you performing so I can check your form?");
  }
  
  sendMessage() {
    const message = this.userMessageInput.value.trim();
    if (!message) return;
    
    this.addUserMessage(message);
    this.userMessageInput.value = '';
    
    // Process the message and respond
    this.processUserMessage(message);
  }
  
  addUserMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message user-message';
    messageEl.innerHTML = `<p>${message}</p>`;
    this.messageContainer.appendChild(messageEl);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    this.messages.push({ role: 'user', content: message });
  }
  
  addBotMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message bot-message';
    messageEl.innerHTML = `<p>${message.replace(/\n/g, '</p><p>')}</p>`;
    this.messageContainer.appendChild(messageEl);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    this.messages.push({ role: 'bot', content: message });
  }
  
  processUserMessage(message) {
    // Check if there's a video uploaded
    const hasVideo = this.videoPreviewContainer.children.length > 0;
    
    // Simple rule-based responses for demo purposes
    const lowerMessage = message.toLowerCase();
    
    if (!hasVideo && !lowerMessage.includes('help') && !lowerMessage.includes('hi') && !lowerMessage.includes('hello')) {
      this.addBotMessage("Please upload a video of your exercise so I can provide specific feedback on your form.");
      return;
    }
    
    // Exercise-specific responses
    if (lowerMessage.includes('squat')) {
      this.addBotMessage("Based on your squat video, here are some form tips:\n\n1. Ensure your knees track over your toes but don't go past them\n2. Keep your back neutral - not rounded or excessively arched\n3. Go below parallel if your mobility allows\n4. Distribute weight through your heels and midfoot\n5. Keep your chest up throughout the movement");
    } else if (lowerMessage.includes('deadlift')) {
      this.addBotMessage("Looking at your deadlift, here's my feedback:\n\n1. Keep the bar close to your body throughout the movement\n2. Engage your lats before lifting\n3. Hinge at the hips - this is a hip hinge, not a squat\n4. Maintain a neutral spine position\n5. Stand fully upright at the top of the movement");
    } else if (lowerMessage.includes('push up') || lowerMessage.includes('pushup')) {
      this.addBotMessage("Reviewing your push-up form:\n\n1. Keep your body in a straight line from head to heels\n2. Position hands about shoulder-width apart\n3. Lower your chest all the way to the floor\n4. Keep elbows at about a 45° angle to your body - not flared out\n5. Engage your core throughout the movement");
    } else if (lowerMessage.includes('bench press') || lowerMessage.includes('benchpress')) {
      this.addBotMessage("Analyzing your bench press form:\n\n1. Keep your feet flat on the floor\n2. Maintain a slight arch in your lower back\n3. Retract your shoulder blades\n4. Lower the bar to your mid-chest\n5. Keep your wrists straight and elbows at about 45° to your body");
    } else if (lowerMessage.includes('pull up') || lowerMessage.includes('pullup')) {
      this.addBotMessage("Here's my feedback on your pull-up form:\n\n1. Start from a dead hang with shoulders engaged\n2. Pull until your chin is over the bar\n3. Keep your core engaged to prevent swinging\n4. Lower with control rather than dropping quickly\n5. Maintain a neutral wrist position");
    } else if (lowerMessage.includes('lunge')) {
      this.addBotMessage("Reviewing your lunge technique:\n\n1. Step forward far enough that your knee forms a 90° angle\n2. Keep your front knee tracking over your toes\n3. Keep your torso upright\n4. Lower your back knee toward the floor\n5. Push through your front heel to return to standing");
    } else if (lowerMessage.includes('help') || lowerMessage.includes('exercises')) {
      this.addBotMessage("I can help with form checks for many exercises including squats, deadlifts, bench press, push-ups, pull-ups, lunges, and more! Just upload a video and let me know which exercise you're performing.");
    } else {
      this.addBotMessage("I'm analyzing your form. For more specific feedback, please tell me which exercise you're performing (e.g., squat, deadlift, push-up, etc.)");
    }
  }
  
  show() {
    if (this.formCheckWrapper) {
      this.formCheckWrapper.classList.remove('hidden');
      document.body.classList.add('form-check-open');
    }
  }
  
  hide() {
    if (this.formCheckWrapper) {
      this.formCheckWrapper.classList.add('hidden');
      document.body.classList.remove('form-check-open');
    }
  }
  
  toggle() {
    if (this.formCheckWrapper) {
      if (this.formCheckWrapper.classList.contains('hidden')) {
        this.show();
      } else {
        this.hide();
      }
    }
  }
}

// Create the overlay once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create overlay for form check fullscreen mode
  if (!document.querySelector('.form-check-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'form-check-overlay';
    document.body.appendChild(overlay);
  }
  
  // Find or create the form check container
  let formCheckContainer = document.getElementById('form-check-container');
  if (!formCheckContainer) {
    formCheckContainer = document.createElement('div');
    formCheckContainer.id = 'form-check-container';
    document.body.appendChild(formCheckContainer);
  }
  
  // Initialize the form check
  const formCheck = new FormCheck('#form-check-container');
  
  // Hide the form check initially
  formCheck.hide();
  
  // Create toggle button if it doesn't exist
  let toggleButton = document.querySelector('.form-check-toggle-btn');
  if (!toggleButton) {
    toggleButton = document.createElement('button');
    toggleButton.className = 'form-check-toggle-btn';
    toggleButton.innerHTML = '<i class="fas fa-dumbbell"></i>';
    toggleButton.setAttribute('aria-label', 'Open form checker');
    document.body.appendChild(toggleButton);
  }
  
  // Add event listeners
  toggleButton.addEventListener('click', () => formCheck.toggle());
  
  // Add event listener to the overlay
  const overlay = document.querySelector('.form-check-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        formCheck.hide();
      }
    });
  }
  
  // Make the formCheck instance globally available
  window.formCheck = formCheck;
  
  // Find any "try form check" buttons and attach event listeners
  document.querySelectorAll('[data-form-check-open]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      formCheck.show();
    });
  });
});
