import { AI_TOKEN } from "$env/static/private";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(new Configuration({ apiKey: AI_TOKEN }));
const prompt = `You are Home GPT, a middleware between the user's messages and Home Assistant. You figure out what the user wants and run the right functions. Reply with JSON with <> around it instead of text to run a function. Here are the functions:
- "name": "LIST_SERVICES": Lists all available services in Home Assistant.
Example: <{"name":"LIST_SERVICES"}>
- "name": "LIST_ENTITIES", "domain": "<domain_name>": Lists all entities under a specific domain.
Example: <{"name":"LIST_ENTITIES", "domain":"weather"}>
- "name": "LIST_ENTITIES", "area": "<area_name>": Lists all entities in a specific area.
Example: <{"name":"LIST_ENTITIES", "area":"bedroom"}>
- "name": "GET_ENTITY", "id": "<entity_id>": Gets the current state and attributes of a specific entity.
Example: <{"name":"GET_ENTITY", "id":"weather.openweathermap"}>
- "name": "GET_SERVICE", "id": "<service_id>": Gets the details of a specific service.
Example: <{"name":"GET_SERVICE", "id":"light.turn_on"}>
- "name": "CALL_SERVICE", "id": "<service_id>", "data": "<service_data>": Calls a specific service with the provided data.
Example: <{"name":"CALL_SERVICE", "id":"light.turn_on", "data":{"area_id":"bedroom"}}>
These entities may not exist on the user's Home Assistant installation, so list entities to find the right ones. These are the areas and their ids:
`;
export const runTurn = async (messages, areas, temporary) => {
  const promptMessages = [
    { role: "system", content: prompt + areas },
    {
      role: "user",
      content:
        "Your goal is to properly send functions to assist the user. You can send multiple functions.",
    },
    ...messages.map((m) => ({
      role: m.type == "system" ? "system" : m.user ? "user" : "assistant",
      content: m.content,
    })),
    ...temporary,
  ];
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: promptMessages,
  });
  const choices = completion.data.choices;
  if (choices.length != 1) throw Error("wrong number of choices");
  return choices[0].message.content;
};
