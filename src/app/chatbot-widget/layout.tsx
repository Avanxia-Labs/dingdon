// app/chatbot-widget/layout.tsx
import React from 'react';

// Este layout se aplicará solo a /chatbot-widget
export default function ChatbotWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Añadimos una clase para aplicar los estilos de "lienzo en blanco"
    <html lang="en" className="widget-layout">
      <body>{children}</body>
    </html>
  );
}