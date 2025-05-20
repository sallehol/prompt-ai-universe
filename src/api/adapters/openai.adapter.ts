
// Placeholder for OpenAI adapter implementation
// import { ApiResponseAdapter, ChatCompletionResponse, AdaptedChatMessage } from './base.adapter';
//
// export class OpenAIAdapter implements ApiResponseAdapter<any, AdaptedChatMessage> {
//   adapt(response: any): AdaptedChatMessage {
//     // Logic to adapt OpenAI API response to your Message format
//     // This is highly dependent on the actual OpenAI response structure
//     const choice = response.choices?.[0];
//     if (!choice?.message) {
//       throw new Error('Invalid OpenAI response format');
//     }
//     return {
//       id: response.id || Date.now().toString(),
//       role: 'assistant',
//       content: choice.message.content,
//       timestamp: Date.now(),
//       isSaved: false,
//       metadata: {
//         model: response.model,
//         provider: 'openai',
//         usage: response.usage,
//       }
//     };
//   }
// }
export {}; // Keep TypeScript happy
