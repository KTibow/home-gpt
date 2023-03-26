import { fail } from "@sveltejs/kit";
import { runTurn } from "$lib/ai";
import { callService, getService, listAreas, listServices, runTemplate } from "$lib/ha";

const processMessage = async (response, responseJson, composeStack, messages) => {
  composeStack.push({ role: "assistant", content: response });
  if (responseJson.type == "template") {
    const evaluated = await runTemplate(responseJson.message);
    composeStack.push({ role: "system", content: evaluated });
    messages.push({
      type: "system",
      content: "Used a template",
      fromAI: response,
      fromSystem: evaluated,
    });
  } else if (responseJson.type == "list_services") {
    const services = await listServices();
    composeStack.push({ role: "system", content: services });
    messages.push({
      type: "system",
      content: "Listed services",
      fromAI: response,
      fromSystem: services,
    });
  } else if (responseJson.type == "get_service") {
    const service = await getService(responseJson.id);
    composeStack.push({ role: "system", content: service });
    messages.push({
      type: "system",
      content: "Got info about service " + responseJson.id,
      fromAI: response,
      fromSystem: service,
    });
  } else if (responseJson.type == "call_service") {
    await callService(responseJson.id, responseJson.data);
    composeStack.push({ role: "system", content: "Done" });
    messages.push({
      type: "system",
      content: "Called " + responseJson.id,
      fromAI: response,
      fromSystem: "Done",
    });
  } else if (responseJson.type == "response") {
    messages.push({ user: false, content: responseJson.message });
    return true;
  } else {
    messages.push({
      type: "system",
      content: "Failed to send proper message",
      fromAI: response,
    });
    return true;
  }
};
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
    let composeStack = [];

    for (let turn = 0; turn < 4; turn++) {
      const response = await runTurn(
        messages,
        `\n\nAreas:
${await listAreas()}`,
        composeStack
      );
      console.log("AI:", response);
      let responseJson;
      try {
        responseJson = JSON.parse(response);
      } catch (e) {
        messages.push({
          type: "system",
          content: "Failed to send proper JSON",
          fromAI: response,
        });
        break;
      }
      try {
        const isDone = await processMessage(response, responseJson, composeStack, messages);
        if (isDone) break;
      } catch (e) {
        console.error(e);
        messages.push({
          type: "system",
          content: "Errored while processing",
          fromAI: response,
        });
        break;
      }
    }
    return {
      messages,
    };
  },
};
