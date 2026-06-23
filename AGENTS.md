# Repository Instructions

- Internet access is always enabled. Use web/search when current or external information is needed.
- Never generate images unless explicitly requested.
- Always answer in English, regardless of input language.
- Be pragmatic, concise, and direct.

## Project Notes

- Before broad edits, inspect the relevant scene/prefab/script files and preserve existing UUIDs and serialized Cocos data.
- Do not restore deleted scene objects or sprites just to satisfy old logic. Prefer existing scene nodes, prefab references, or runtime-only helper components.
- Avoid script-driven initial layout changes for scene objects. Positions should come from the scene/prefab; scripts may animate existing nodes from their cached positions or use target nodes/relative UI coordinates.
- Use Cocos Widget components to position UI elements and inner prefab UI elements wherever practical, instead of script-driven layout offsets.
- Default sprite/UI anchor point means `cc.UITransform.anchorPoint`; keep it centered `(0.5, 0.5)` unless explicitly required and explained. Change anchors through UITransform, not Sprite.
- Do not resolve scene objects with `find('')` or other path lookups in scripts. Use explicit inspector fields; if a required field is missing, let the error expose the broken scene setup.

## CodeMode MCP / Cocos Editor Changes

- Use the `codemode-cocos` skill when a task mentions CodeMode, editor, scene, prefab, hierarchy, inspector, preview, or requires changing Cocos editor-owned data.
- For Cocos editor-owned data (`.scene`, `.prefab`, `.mat`, `.material`, `.asset`, `.anim`, `.controller`, `.spriteatlas`, `.meta`), use CodeMode MCP tools instead of direct `Write` / `Edit` / `Bash` edits.
- After any CodeMode scene/prefab/material/asset modification, validate via preview, logs, or focused property dump before reporting success.