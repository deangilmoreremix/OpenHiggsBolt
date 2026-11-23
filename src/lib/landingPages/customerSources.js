/**
 * Pure collector: every customer the Personalization window, Lead Finder and the contact tools know about,
 * as normalized customers (see customerProfile.js). The app passes in what it has (React context, localStorage,
 * the leads response); nothing here reads storage or the network.
 */
import { normalizeCustomer, dedupeCustomers, attachPersonalImages } from './customerProfile.js';

/**
 * @param {object} input
 * @param {object} [input.clientForm]       the client being edited in the Personalization window
 * @param {string} [input.selectedClientId] the current client id
 * @param {object[]} [input.clients]        all saved clients
 * @param {Record<string, object>} [input.assetsByClient] saved logo libraries by client id
 * @param {object} [input.assets]           the open window's asset library (primaryLogo)
 * @param {object} [input.brandColors]      previewSettings.brandColors of the open window
 * @param {object} [input.selectedBusiness] the business picked in Find your business
 * @param {object[]} [input.leads]          saved Lead Finder leads
 * @param {object[]} [input.contacts]       people the caller already has ({firstName, lastName, company, email, ...})
 * @param {object[]} [input.projects]       saved Personalization projects (their generated pictures)
 * @returns {{ customers: object[], activeId: string }}
 */
export function collectCustomers({ clientForm, selectedClientId = '', clients = [], assetsByClient = {}, assets, brandColors, selectedBusiness, leads = [], contacts = [], projects = [] } = {}) {
  const out = [];
  const currentId = selectedClientId || clientForm?.id || '';
  const hasForm = clientForm && (clientForm.businessName || clientForm.name);
  if (hasForm) out.push(normalizeCustomer({ ...clientForm, id: currentId || clientForm.id }, 'client', { assets, brandColors }));
  (Array.isArray(clients) ? clients : []).forEach((c) => out.push(normalizeCustomer(c, 'client', { assets: c?.id === currentId ? (assets || assetsByClient[c.id]) : assetsByClient[c?.id], brandColors: c?.id === currentId ? brandColors : undefined })));
  if (selectedBusiness) out.push(normalizeCustomer({ business: selectedBusiness, id: selectedBusiness.id }, 'lead', { assets, brandColors }));
  (Array.isArray(leads) ? leads : []).forEach((l) => out.push(normalizeCustomer(l, 'lead')));
  (Array.isArray(contacts) ? contacts : []).forEach((c, i) => out.push(normalizeCustomer({ id: c?.id || `contact-${i}`, ...c }, 'contact')));
  const list = out.filter(Boolean);
  const activeId = list.find((c) => c.id === currentId)?.id || (hasForm ? list[0]?.id : '') || '';
  // The active customer first (the one in the open Personalization window), then the rest in order.
  const ordered = [...list.filter((c) => c.id === activeId), ...list.filter((c) => c.id !== activeId)];
  return { customers: attachPersonalImages(dedupeCustomers(ordered), projects), activeId };
}
