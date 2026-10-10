import { loadVerificationMail, type Logger } from '@unblok/backend-runtime';
interface Delivery { once(send: (email: string, token: string, id: string) => Promise<void>): Promise<boolean> }
export function startVerificationDispatcher(delivery: Delivery, mail: ReturnType<typeof loadVerificationMail>, logger: Logger) {
  let stopping = false, active: Promise<void> | undefined;
  const send = async (email: string, token: string, id: string) => {
    const response = await fetch(mail.endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2000),
      headers: { 'content-type': 'application/json', ...(mail.username ? { authorization: 'Basic ' + Buffer.from(`${mail.username}:${mail.password}`).toString('base64') } : {}) },
      body: JSON.stringify({ From: { Email: mail.from }, To: [{ Email: email }], Subject: 'Verify your Unblok email',
        Text: `Use this one-use proof while signed into the same Unblok account. It expires 15 minutes after it was requested.\n${token}\nIf you did not request this, ignore it.`, MessageID: `<${id}@unblok-verification>` }) });
    // Acknowledgement is not end-recipient delivery. Do not log response bodies.
    await response.body?.cancel(); if (!response.ok) throw new Error('Mail acknowledgement unavailable');
  };
  const tick = () => {
    if (stopping || active) return;
    active = delivery.once(send).then(() => {}, () => { logger.warn({ event: 'verification_delivery_unavailable' }); }).finally(() => { active = undefined; });
  };
  const timer = setInterval(tick, 1000); tick();
  return { close: async () => { stopping = true; clearInterval(timer); await active; }, send };
}
