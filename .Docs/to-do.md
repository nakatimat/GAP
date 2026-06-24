# GAP - Gestão de Ativos e Patrimônio
## Histórico de Problemas Resolvidos (Dia 24/06/2026)

### 1. Tauri Plugin SQL bloqueado (Não Salvava)
- **Problema:** A aplicação permitia clicar em "Salvar" no modal, mas nada era registrado no banco de dados.
- **Causa:** Na versão nova do Tauri (v2), os plugins nativos vêm bloqueados por padrão.
- **Solução:** Adicionamos as permissões `sql:default`, `fs:default` e `dialog:default` no arquivo `Motor_Desktop/capabilities/default.json`. 
- **Observação:** Requer reinicialização completa do `npm run tauri dev` para que as capabilities tenham efeito no motor em C++/Rust.

### 2. Labels Sobrepostas nos Inputs de Data
- **Problema:** O texto "Data de Aquisição *" e "Data de Posse *" ficava sobreposto com o placeholder nativo "dd/mm/aaaa" do `<TextField type="date">`.
- **Causa:** O placeholder nativo não obedece ao comportamento clássico de "shrink" do Material UI.
- **Solução:** O label nativo do componente foi removido e trocado por uma tag `<Typography>` independente, flutuando perfeitamente acima da caixa de texto.

### 3. Conflitos de Tipagem com MUI v6 (Grid e InputProps)
- **Problema:** A IDE indicava erros vermelhos de incompatibilidade no componente `<Grid>` (`Property 'item' does not exist`) e no `<TextField>` (`InputProps`).
- **Causa:** O projeto atualizou para o Material UI (v6), que substituiu a propriedade `item` pela tag nativa atualizada com a prop `size`, além de substituir o `InputProps` por `slotProps`.
- **Solução:** O código em `App.tsx` foi inteiramente refatorado substituindo `<Grid item xs={12}>` por `<Grid size={{ xs: 12 }}>`, e as buscas globais agora usam `slotProps`.

---

## 📋 To-Do / Próximos Passos Sugeridos

- [ ] **Validação de Inputs:** Melhorar as mensagens caso o usuário tente cadastrar um código já existente no banco sem exibir apenas um erro genérico via `alert()`.
- [ ] **Edição de Ativos/Colaboradores:** Implementar um botão "Editar" na listagem para corrigir typos em códigos e nomes (hoje apenas inserimos e excluímos).
- [ ] **Raw SQL Export:** A função atual de Backup exporta o banco limpo no formato JSON (restaurável pela ferramenta nativa). Avaliar a real necessidade de exportar um `.sql` puro se o projeto desejar migrar para outro framework externo.
- [ ] **Limpeza:** Analisar pasta pública ou assets para remover ícones inutilizados.
