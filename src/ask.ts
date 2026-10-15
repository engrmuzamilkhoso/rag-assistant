
type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;

};
const res = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.2:3b",
    messages: [
                
            {
            role: "system",
            content: `You are a support assistant for a payment company.
            Answer ONLY using the policy below.
            If the answer is not in the policy, say: "I don't know, please contact support."

            POLICY:
            - Customers can request a refund within 14 days of payment.
            - Card refunds take 5 to 7 business days.
            - Wallet refunds (JazzCash, Easypaisa) are instant, up to 24 hours.
            - Refunds are not allowed during an active chargeback dispute.
            
            Apply the policy rules to the user’s case. Explain in one line`
            ,
            },

      {
        role: "user",
        content: "Can I get a refund after 20 days?",
      },
    ],
    stream: false,

    options: { temperature: 0 },
  }),
});

const data : OllamaChatResponse = await res.json();

console.log(data.message.content);