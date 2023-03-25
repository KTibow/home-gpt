<script>
  import { onMount } from "svelte";
  import Message from "./Message.svelte";

  export let form;
  onMount(() => console.log(form));
  let messages = [{ user: false, content: "How can I assist?" }];
  if (form && form.messages) messages = form.messages;
</script>

<main class="mx-auto max-w-prose py-4 flex flex-col h-screen gap-8">
  <h1 class="lg:text-5xl text-3xl">Home GPT</h1>
  <div class="grow overflow-auto gap-4 flex flex-col">
    {#each messages as message}
      <Message {message} />
    {/each}
  </div>
  <form class="flex gap-4" method="post">
    <input type="hidden" value={JSON.stringify(messages)} name="messages" />
    <input class="grow bg-slate-800 p-4 rounded-lg" name="message" />
    <button class="bg-teal-600 px-6 rounded-lg hover:bg-teal-700 transition-all">Send</button>
  </form>
</main>
