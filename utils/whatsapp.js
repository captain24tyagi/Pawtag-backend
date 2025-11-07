import axios from 'axios'
import MessageLog from '../models/MessageLog.js';

const BASE_URL = `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`;

export const sendSessionMessage = async (toEncrypted, text, petId) => {
  const to = toEncrypted;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  try {
    const { data } = await axios.post(BASE_URL, payload, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    });
    await MessageLog.create({
      pet: petId,
      direction: "outbound",
      to,
      messageType: "session",
      body: data,
    });
    console.log('✅ Sent session message to', to);
  } catch (err) {
    console.error('❌ sendSessionMessage error:', err.response?.data || err.message);
  }
};

export const sendTemplateMessage = async (toEncrypted, templateName, vars = [], petId) => {
  const to = toEncrypted;
  const components = vars.length
    ? [{ type: 'body', parameters: vars.map(v => ({ type: 'text', text: String(v) })) }]
    : [];
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components,
    },
  };

  try {
    const { data } = await axios.post(BASE_URL, payload, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    });
    //await MessageLog.create({ direction: 'outbound', to, body: data, petId, messageType: 'template' });
    await MessageLog.create({
        pet: petId,
        direction: "inbound",
        to,
        messageType: "template",
        body: msgObj,
    });
    console.log('✅ Sent template', templateName, 'to', to);
  } catch (err) {
    console.error('❌ sendTemplateMessage error:', err.response?.data || err.message);
  }
};
