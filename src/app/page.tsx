import { ChatbotUI } from "@/components/chatbot/ChatbotUI";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          Welcome to GYB Connect Inc.
        </h1>
        <p className="text-xl text-gray-300">
          Scroll down or explore the page. The chat assistant is always available in the corner.
        </p>
      </div>

      {/* 
        El componente del Chatbot se renderiza aquí.
        Gracias a su CSS con `position: fixed`, se colocará
        automáticamente en la esquina inferior derecha de la pantalla,
        independientemente de dónde lo coloquemos en el TSX.
      */}
      <ChatbotUI />

    </main>
  );
}
