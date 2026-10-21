export const buildWhatsAppUrl = (phone: string, message: string): string => {
  // Limpiar número: quitar +, guiones, espacios, paréntesis
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

export const getPaymentReminderMessage = (
  clientName: string,
  daysRemaining: number,
  amount: number,
  planName: string
): string => {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return `Hola ${clientName}! Te escribo de ZGym para recordarte que tu cuota del ${planName} venció hace ${overdueDays} día(s). El total a abonar es de $${amount}. ¿Te gustaría que te pase los datos de pago para renovar?`;
  }
  if (daysRemaining === 0) {
    return `Hola ${clientName}! Te escribo de ZGym para recordarte que tu cuota del ${planName} ($${amount}) vence hoy. Avisame cuando puedas regularizarla. Saludos!`;
  }
  return `Hola ${clientName}! Te escribo de ZGym para avisarte que tu cuota del ${planName} ($${amount}) vence en ${daysRemaining} día(s). Que tengas buen entrenamiento!`;
};

export const getWorkoutWelcomeMessage = (clientName: string, routineTitle: string): string => {
  return `Hola ${clientName}! Ya tenés asignada tu nueva rutina "${routineTitle}" en la plataforma de ZGym. Podés ingresar a ver los ejercicios y videos explicativos. ¡A darle con todo!`;
};
