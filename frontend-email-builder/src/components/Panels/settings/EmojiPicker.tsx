import { useState, useMemo } from 'react';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😋','😛','🤔','🤗','🤫','🤭','😶','😏','😌','😴','🥳','😎','🤓','🧐','😱','😨','😰','😥','😢','😭','😤','😠','😡','🥺','😳','🤯','😬','😮','😲','🥱','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','😵','🤠','🥸','😈','👿','💀','☠️','👻','👽','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
  },
  {
    label: 'Hands & People',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','🦾','🖕','✍️','🤳','💅','🦵','🦶','👂','🦻','👃','👶','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','👯','🧖','🧗','🧘','🛀','🛌'],
  },
  {
    label: 'Nature',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🌸','💮','🏵️','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🪴','🌲','🌳','🌴','🌵','🌿','☘️','🍀','🍁','🍂','🍃','🪹','🪺','🍄'],
  },
  {
    label: 'Food & Drink',
    emojis: ['🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🥜','🫘','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫','🍝','🍜','🍛','🍣','🍱','🥟','🍤','🍙','🍘','🍥','🥮','🍡','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍩','🍪','☕','🍵','🫖','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🍸','🍹','🧃','🥛','🫗'],
  },
  {
    label: 'Activity & Sports',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🧩'],
  },
  {
    label: 'Travel & Places',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🚨','🚔','🚍','🚘','🚖','🛞','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🛩️','✈️','🛫','🛬','🪂','💺','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','🚢','⛽','🏗️','🚧','🏠','🏡','🏘️','🏚️','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️','🗾','🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁'],
  },
  {
    label: 'Objects',
    emojis: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','📷','📸','📹','🎞️','📽️','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','📡','🔋','🔌','💡','🔦','🕯️','🪔','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🗜️','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🏧'],
  },
  {
    label: 'Symbols',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❓','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏳️','🏴','🏁','🚩','🎌','🏴‍☠️','✨','🔥','💫','⭐','🌟','💥','💦','💨','🕳️','💣','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'],
  },
  {
    label: 'Flags',
    emojis: ['🏳️','🏴','🏁','🚩','🎌','🏴‍☠️','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇯🇵','🇰🇷','🇨🇳','🇧🇷','🇮🇳','🇷🇺','🇦🇺','🇨🇦','🇲🇽','🇹🇷','🇸🇦','🇦🇪','🇳🇱','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇺🇦','🇨🇭','🇦🇹','🇧🇪','🇵🇹','🇬🇷','🇨🇿','🇷🇴','🇭🇺','🇮🇪','🇮🇱','🇪🇬','🇿🇦','🇳🇬','🇰🇪','🇬🇭','🇹🇭','🇻🇳','🇮🇩','🇵🇭','🇲🇾','🇸🇬','🇳🇿','🇦🇷','🇨🇱','🇨🇴','🇵🇪'],
  },
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

export function EmojiPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return null; // show categories when not searching
    // Simple search: just filter all emojis (emoji search by character doesn't work well,
    // but we include it for pasting). The main UX is browsing by category.
    return ALL_EMOJIS;
  }, [search]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        style={{
          padding: '4px 10px', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 6, background: 'var(--panel-bg, #fff)', cursor: 'pointer',
          fontSize: 20, lineHeight: 1, minWidth: 42, textAlign: 'center',
        }}
      >
        {value || '😀'}
      </button>

      {showPicker && (
        <div style={{
          marginTop: 6, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 8,
          background: 'var(--panel-bg, #fff)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {/* Search */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emojis..."
              style={{ width: '100%', fontSize: 12, padding: '4px 8px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 4 }}
            />
          </div>

          {/* Category tabs */}
          {!filtered && (
            <div style={{
              display: 'flex', gap: 2, padding: '4px 6px', overflowX: 'auto',
              borderBottom: '1px solid var(--border-color, #e2e8f0)', fontSize: 10,
            }}>
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(i)}
                  style={{
                    padding: '2px 6px', border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: activeCategory === i ? '#6366f1' : 'transparent',
                    color: activeCategory === i ? '#fff' : 'var(--text-secondary, #64748b)',
                    whiteSpace: 'nowrap', fontSize: 10, fontWeight: 500,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div style={{ maxHeight: 180, overflowY: 'auto', padding: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2 }}>
              {(filtered || EMOJI_CATEGORIES[activeCategory].emojis).map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => { onChange(emoji); setShowPicker(false); setSearch(''); }}
                  style={{
                    padding: 4, border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: value === emoji ? '#e0e7ff' : 'transparent',
                    fontSize: 18, lineHeight: 1, textAlign: 'center',
                  }}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
