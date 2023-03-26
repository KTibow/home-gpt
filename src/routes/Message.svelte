<script>
  let expanded = false;
  export let message;
</script>

{#if message.type == "system"}
  <button class="text-teal-500 hover:text-teal-400" on:click={() => (expanded = !expanded)}>
    {message.content}
  </button>
  {#if expanded}
    <div class="px-4 flex gap-2">
      <div class="whitespace-pre-wrap p-2 bg-slate-800 rounded-xl grow flex flex-col">
        <p class="text-teal-500">AI:</p>
        <p class="whitespace-pre-wrap">{message.fromAI}</p>
      </div>
      {#if message.fromSystem}
        <div class="whitespace-pre-wrap p-2 bg-amber-900 rounded-xl grow flex flex-col">
          <p class="text-amber-500">System:</p>
          <p class="whitespace-pre-wrap">{message.fromSystem}</p>
        </div>
      {/if}
    </div>
  {/if}
{:else}
  <div class="p-2 px-4 rounded-xl {message.user ? 'bg-teal-900' : 'bg-slate-800'}">
    <span class="whitespace-pre-wrap">{message.content}</span>
  </div>
{/if}
