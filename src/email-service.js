/**
 * Abstracted Email & Lead Dispatch Service Module
 * Handles API transport, endpoint selection (Web3Forms/FormSubmit/Custom API),
 * payload validation, and clean error parsing.
 */

export class EmailService {
  constructor(config = {}) {
    this.provider = config.provider || 'web3forms';
    this.web3FormsKey = config.web3FormsKey || import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '5bbf0a74-98ae-4f67-a8a2-2b6200257efc';
    this.customEndpoint = config.customEndpoint || import.meta.env.VITE_CONTACT_API_URL || null;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Dispatch lead contact form payload
   */
  async sendLead(formData) {
    const name = formData.get('name') || formData.get('userName');
    const email = formData.get('email') || formData.get('userEmail');
    const message = formData.get('message') || formData.get('projectDetails');
    const honeypot = formData.get('_gotcha');

    // Honeypot Spam Trap Check
    if (honeypot && honeypot.trim() !== '') {
      console.warn('⚠️ Honeypot spam trap triggered. Dropping submission silently.');
      return { success: true, message: 'Thank you! Your message has been sent.' };
    }

    if (!name || name.trim() === '') {
      throw new Error('Please enter your full name.');
    }

    if (!email || !this.isValidEmail(email)) {
      throw new Error('Please provide a valid email address.');
    }

    if (!message || message.trim().length < 5) {
      throw new Error('Please enter a project description (at least 5 characters).');
    }

    // Determine Endpoint Target
    let endpoint = 'https://api.web3forms.com/submit';
    let payload = {};

    if (this.customEndpoint) {
      endpoint = this.customEndpoint;
      payload = Object.fromEntries(formData);
    } else {
      payload = {
        access_key: this.web3FormsKey,
        subject: `⚡ New Portfolio Lead from ${name}`,
        from_name: 'Rishi Saha Portfolio',
        name: name,
        email: email,
        message: message,
        budget: formData.get('budget') || 'Not Specified',
        country: formData.get('country') || 'Default',
        submitted_at: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        return { success: true, message: 'Message sent successfully! I will respond within 24 hours.' };
      } else {
        throw new Error(data.message || 'Server rejected the request. Please try again later.');
      }
    } catch (err) {
      console.error('EmailService Error:', err);
      throw new Error(err.message || 'Network error occurred. Please check your internet connection.');
    }
  }
}

export const defaultEmailService = new EmailService();
