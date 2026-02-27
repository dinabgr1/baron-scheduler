export async function sendWhatsAppNotification(params: {
  pilotName: string
  date: string
  startTime: string
  endTime: string
  withInstructor: boolean
  instructorName?: string
  bookingId: string
  approvalBaseUrl: string
}) {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || 'http://localhost:3001/send-whatsapp'
  const notifyNumber = process.env.WHATSAPP_NOTIFY_NUMBER

  const approvalLink = `${params.approvalBaseUrl}/admin/approve/${params.bookingId}`

  const message = [
    `📋 הזמנה חדשה - Baron 4X-DZJ`,
    ``,
    `👤 טייס: ${params.pilotName}`,
    `📅 תאריך: ${params.date}`,
    `🕐 שעות: ${params.startTime} - ${params.endTime}`,
    params.withInstructor ? `👨‍✈️ מדריך: ${params.instructorName || 'כן'}` : `👨‍✈️ מדריך: לא`,
    ``,
    `🔗 לאישור ההזמנה:`,
    approvalLink,
  ].join('\n')

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: notifyNumber,
        message,
      }),
    })
  } catch (error) {
    console.error('WhatsApp notification failed:', error)
    // Don't throw - booking should still succeed even if notification fails
  }
}
