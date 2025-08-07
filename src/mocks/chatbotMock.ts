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
  
  companyName: "GYB Connect",
  
  services: [
    "Payment Processing Solutions",
    "Interchange Plus Pricing Models",
    "Recurring Payments & Subscriptions",
    "Virtual Terminal Services",
    "Point-of-Sale (Clover) Systems",
    "ACH & Credit Card Processing",
    "Fraud Management & 3D Secure",
    "Chargeback Protection",
    "IVR Payment Solutions",
    "SMS & Email Payment Notifications",
    "Professional Accounting Services",
    "Payroll & Bookkeeping",
    "Company Registration",
    "Branding & E-Commerce Development"
  ],
  
  commonQuestions: [
    {
      question: "What payment methods do you support?",
      answer: "We support all major payment methods including debit & credit cards, ACH payments, and cash management solutions. Our systems are designed to handle diverse payment needs for businesses of all sizes."
    },
    {
      question: "What is interchange plus pricing?",
      answer: "Interchange plus pricing is a transparent pricing model where you pay the actual interchange cost set by card networks plus a fixed markup. This pass-through cost structure ensures you get the most competitive rates available."
    },
    {
      question: "Do you offer recurring payment solutions?",
      answer: "Yes! We provide comprehensive recurring payment solutions including subscription management, payment plans, and automated billing cycles. Perfect for businesses with recurring revenue models."
    },
    {
      question: "What industries do you serve?",
      answer: "We specialize in serving Legal Offices, Jewelry stores, Healthcare providers, and Retail businesses. Our solutions are tailored to meet the specific compliance and processing needs of each industry."
    },
    {
      question: "What fraud protection do you offer?",
      answer: "We provide advanced fraud management tools including 3D Secure authentication, Transaction Risk Scoring, and our advanced Chargeback Module. You'll receive alerts 24-48 hours before potential chargebacks, giving you time to respond proactively."
    },
    {
      question: "Do you offer Point-of-Sale solutions?",
      answer: "Yes, we offer Clover Point-of-Sale systems with integrated payment hardware. Our POS solutions include customizable reports, advanced system tracking, and seamless payment processing."
    },
    {
      question: "What additional business services do you provide?",
      answer: "Beyond payment processing, we offer Professional Accounting Services, Company Registration, Payroll management, Bookkeeping, Business Assessment, and Branding & E-Commerce Development services."
    },
    {
      question: "How do your payment pages work?",
      answer: "Our payment pages are secure, customizable, and can be integrated into your website or sent via SMS and email. They support multiple payment methods and provide a seamless checkout experience for your customers."
    },
    {
      question: "What are your pricing plans?",
      answer: "Our pricing is based on your business volume and specific needs. We offer competitive interchange plus pricing models with transparent, pass-through costs. Would you like to schedule a consultation for a personalized quote based on your business requirements?"
    },
    {
      question: "How fast are deposits processed?",
      answer: "We offer faster deposit options to improve your cash flow. Deposit timing depends on your processing volume and business profile. Contact us to learn about our expedited deposit solutions."
    }
  ]
};