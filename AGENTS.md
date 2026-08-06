# Guidelines for AI Assistants

- **Package Manager**: Always use `pnpm` instead of `npm` for all frontend package operations and build scripts.

## Frontend — MUI v9

The frontend uses `@mui/material` **v9**. Prefer the slots API; do not use removed/legacy component props.

- Style or configure nested parts with `slots` / `slotProps` (camelCase), never `PaperProps`, `BackdropProps`, `TransitionComponent`, `components`, `componentsProps`, or mistyped `SlotProps`.
- Examples:
  - `Drawer` / `Dialog` paper: `slotProps={{ paper: { sx: { … } } }}`
  - Custom transition: `slots={{ transition: MyTransition }}`
  - TextField adornments / input attrs: `slotProps={{ input: {…}, htmlInput: {…}, inputLabel: {…} }}`
- When adding or editing MUI components, check the installed types under `node_modules/@mui/material/<Component>` if unsure whether a prop still exists.
