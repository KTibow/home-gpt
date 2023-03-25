import { fail } from "@sveltejs/kit";
import { runTurn } from "$lib/ai";
import { callService, getService, getState, listAreas, listEntities, listServices } from "$lib/ha";

const actionMatcher = /<({.+?})>/;
/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const messagesStr = data.get("messages");
    const messageStr = data.get("message");
    if (!messagesStr || !messageStr) return fail(400);

    const messages = JSON.parse(messagesStr);
    if (!Array.isArray(messages)) return fail(400);
    messages.push({ user: true, content: messageStr });
    const addSystemMessage = (content, fromAI, fromSystem) =>
      messages.push({ type: "system", fresh: true, content, fromAI, fromSystem });

    let temporary = [];
    let runs = 0;
    while (runs < 5) {
      const response = await runTurn(messages, await listAreas(), temporary);
      console.log("AI:", response);
      const actionStr = response.match(actionMatcher);
      if (actionStr) {
        temporary.push({ role: "assistant", content: response });
        try {
          const action = JSON.parse(actionStr[1]);
          if (action.name == "LIST_SERVICES") {
            const services = await listServices();
            addSystemMessage("Listed services", response, services);
            temporary.push({ role: "system", content: services });
          } else if (action.name == "LIST_ENTITIES" && action.domain) {
            const entities = await listEntities({ domain: action.domain });
            addSystemMessage("Listed entities under " + action.domain, response, entities);
            temporary.push({
              role: "system",
              content: entities,
            });
          } else if (action.name == "LIST_ENTITIES" && action.area) {
            const entities = await listEntities({ area: action.area });
            addSystemMessage("Listed entities under " + action.area, response, entities);
            temporary.push({
              role: "system",
              content: entities,
            });
          } else if (action.name == "GET_ENTITY" && action.id) {
            const state = await getState(action.id);
            addSystemMessage("Got entity " + action.id, response, state);
            temporary.push({
              role: "system",
              content: state,
            });
          } else if (action.name == "GET_SERVICE" && action.id) {
            const service = await getService(action.id);
            addSystemMessage("Got service " + action.id, response, service);
            temporary.push({
              role: "system",
              content: service,
            });
          } else if (action.name == "CALL_SERVICE" && action.id && action.data) {
            addSystemMessage("Called service " + action.id, response, "Done");
            await callService(action.id, action.data);
            temporary.push({
              role: "system",
              content: "Done",
            });
          } else {
            addSystemMessage("Action is invalid", response);
            console.error("Unknown action " + JSON.stringify(action));
            break;
          }
          console.log("System:", temporary.at(-1).content);
        } catch (e) {
          console.error(e);
          messages.push({
            type: "system",
            content: "Action errored",
            fromAI: response,
            fromSystem: e.toString(),
          });
          break;
        }
      } else {
        messages.push({ user: false, content: response });
        break;
      }
      runs++;
    }
    return {
      messages: messages.map((m) => {
        delete m.fresh;
        return m;
      }),
    };
  },
};
