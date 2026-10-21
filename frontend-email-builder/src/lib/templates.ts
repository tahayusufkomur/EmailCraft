import type { EmailTemplate } from '../types/blocks';

export const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
  transactional: 'Transactional',
  event: 'Event',
};

type Blocks = EmailTemplate['body']['blocks'];
type Column = { id: string; blocks: Blocks };

/** A deep copy with new ids on every block and column, so a loaded template never shares ids with another. */
export function withFreshIds(template: EmailTemplate): EmailTemplate {
  const cloned: EmailTemplate = JSON.parse(JSON.stringify(template));
  const reId = (blocks: Blocks): Blocks =>
    blocks.map((b) => ({
      ...b,
      id: crypto.randomUUID(),
      ...(b.type === 'columns'
        ? {
            data: {
              ...b.data,
              columns: (b.data as { columns: Column[] }).columns.map((col) => ({
                ...col,
                id: crypto.randomUUID(),
                blocks: reId(col.blocks),
              })),
            },
          }
        : {}),
    })) as Blocks;
  cloned.header.blocks = reId(cloned.header.blocks);
  cloned.body.blocks = reId(cloned.body.blocks);
  cloned.footer.blocks = reId(cloned.footer.blocks);
  return cloned;
}
