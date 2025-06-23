import { ChatbotConfig } from "@/types/chatbot";


/**
 * @file Provides the initial knowledge base for the chatbot.
 * @description This mock data is used to give the chatbot its personality,
 * define its scope, and provide quick answers to common questions.
 * This will later be replaced or augmented by a real database or JSON file.
 */

/**
 * The initial configuration and knowledge base for the chatbot.
 */
export const MOCK_CHATBOT_CONFIG: ChatbotConfig = {
  companyName: "GYB Connect Inc.",
  services: [
    "AI-powered Customer Support",
    "Automated Lead Follow-up",
    "Cold Outreach Automation",
    "CRM & Multi-channel Integration (WhatsApp, Web, Social Media)",
    "Sales Process Automation",
    "Custom Automation Consulting"
  ],
  commonQuestions: [
    {
      question: "What is AI-powered customer support?",
      answer: "It's a system that uses Artificial Intelligence, like me, to answer customer questions 24/7 across different channels, freeing up your human agents for more complex issues."
    },
    {
      question: "How does lead follow-up automation work?",
      answer: "Our system automatically sends personalized messages and reminders to your prospects based on their actions, ensuring no lead goes cold and guiding them through the sales funnel."
    },
    {
      question: "What platforms can you integrate with?",
      answer: "We offer seamless integration with WhatsApp, WordPress websites, Facebook, Instagram, email, and can build custom integrations for your existing CRM or other tools."
    },
    {
      question: "What are the pricing plans?",
      answer: "Our pricing is tailored to your specific needs, depending on the volume of interactions and the level of customization. Would you like to schedule a call with a sales specialist for a personalized quote?"
    }
  ]
};