import { HA_ENDPOINT, HA_TOKEN } from "$env/static/private";

const fetchData = async (endpoint, options = {}) => {
  const headers = { Authorization: `Bearer ${HA_TOKEN}` };
  const response = await fetch(HA_ENDPOINT + endpoint, { headers, ...options });
  if (!response.ok) {
    throw new Error(
      `Error fetching data from Home Assistant: ${response.status} ${await response.text()}`
    );
  }
  return response;
};

const cache = {};
const cachedServices = async () => {
  if (!cache.services) {
    const resp = await fetchData("/api/services");
    cache.services = await resp.json();
  }
  return cache.services;
};

export const listAreas = async () => {
  if (cache.areas) return cache.areas;
  const resp = await fetchData("/api/template", {
    method: "POST",
    body: JSON.stringify({
      template: `{% set areas = states
  | selectattr('attributes.device_class', 'defined') 
  | map(attribute='entity_id')
  | map('area_id') | unique | reject('none') | list %}
{% for area in areas -%}
{{ area_name(area) }}: {{ area }}
{% endfor %}`,
    }),
  });
  return (cache.areas = await resp.text());
};
export const listServices = async () => {
  let text = "";
  for (const domain of await cachedServices()) {
    const services = Object.keys(domain.services);
    text += `${domain.domain}
---
${services.join("\n")}
`;
  }
  return text;
};
export const getService = async (serviceName) => {
  const [domainChunk, serviceChunk] = serviceName.split(".");
  if (!domainChunk || !serviceChunk) return;

  const domains = await cachedServices();
  const domain = domains.find((d) => d.domain == domainChunk);
  if (!domain) return;

  const service = domain.services[serviceChunk];
  if (!service) return;

  let text = `${service.name}`;
  if (service.description) {
    text += ` | ${service.description.trim()}`;
  }

  text += `
Target: ${JSON.stringify(service.target)}
Fields:
`;

  for (const [fieldId, field] of Object.entries(service.fields)) {
    if (field.advanced) continue;
    text += `${field.name}: ${fieldId}, ${Object.keys(field.selector).join(", ")}
`;
  }
  return text;
};
export const callService = async (serviceName, data) => {
  const serviceParts = serviceName.split(".");
  if (serviceParts.length != 2) return;

  await fetchData(`/api/services/${serviceParts[0]}/${serviceParts[1]}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
export const runTemplate = async (template) => {
  const resp = await fetchData("/api/template", {
    method: "POST",
    body: JSON.stringify({
      template,
    }),
  });
  return await resp.text();
};
