# CheerpX FNF Launcher

Este projeto permite rodar várias engines de Friday Night Funkin' e seus mods diretamente no navegador, usando a tecnologia de virtualização [CheerpX](https://cheerpx.com/).

Ele é projetado para ser hospedado estaticamente (por exemplo, no GitHub Pages) e inclui um workflow de GitHub Actions para compilar automaticamente as engines de FNF a partir de seu código-fonte.

## Funcionalidades

- **Multi-Engine**: Suporte para várias engines populares de FNF, selecionáveis a partir de um launcher.
- **Instalação de Mods via Drag-and-Drop**:
  - **Modo Fácil**: Arraste um arquivo `.zip` de um mod para a janela para instalá-lo automaticamente. A lógica detecta o tipo de engine (Psych, V-Slice) para extrair os arquivos corretamente.
  - **Modo Avançado**: Arraste arquivos diretamente para o explorador de arquivos integrado para controle total.
- **Explorador de Arquivos**: Navegue pelo sistema de arquivos da máquina virtual diretamente na interface.
- **Networking com Tailscale/Headscale**: Conecte a aplicação a uma rede VPN para habilitar funcionalidades online (como multiplayer) usando seu próprio servidor Headscale.
- **Compilação Automatizada**: Um workflow de GitHub Actions compila as engines FNF para Linux x86 (32-bit), prontas para serem usadas pelo CheerpX.

---

## Como Usar

### 1. Executando Localmente

Para testar o projeto localmente, você precisa de um servidor web que sirva os arquivos com os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`.

1.  Certifique-se de ter o `nginx` instalado.
2.  Navegue até o diretório raiz do projeto.
3.  Execute o nginx com o arquivo de configuração fornecido:
    ```bash
    nginx -p . -c nginx.conf
    ```
4.  Acesse `http://localhost:8080` no seu navegador.

### 2. Selecionando uma Engine

Na tela inicial, clique no card da engine que você deseja iniciar.

### 3. Instalando Mods

Com a engine rodando, simplesmente arraste um arquivo `.zip` do mod para a janela do navegador. O mod será instalado e o FNF reiniciado (funcionalidade de reinício é um placeholder).

---

## Compilação (Avançado)

### Compilando a Imagem do Sistema (cheerpXImage.ext2)

A imagem base do Alpine Linux pode ser customizada e compilada.

1.  **Dependências**: Você precisa de `podman` and `buildah`.
2.  Navegue até o diretório `image/`.
3.  Execute o script de compilação:
    ```bash
    ./build_image.sh
    ```
    Isso irá gerar um novo `cheerpXImage.ext2` no diretório raiz do projeto.

### Compilando as Engines de FNF

O projeto é configurado para compilar as engines automaticamente usando GitHub Actions.

1.  O workflow está em `.github/workflows/build-engines.yml`.
2.  Ele é executado em cada push para a branch `main` e também diariamente.
3.  Após a conclusão, ele faz o upload de um artefato chamado `fnf-engines` (ou artefatos individuais por engine) contendo os binários compilados.

**Nota Importante**: Para que as engines compiladas sejam utilizadas, você precisa:
1.  Baixar os artefatos do GitHub Actions.
2.  Extraí-los e colocá-los dentro do diretório `image/cheerpXFS/usr/local/bin/` (você pode precisar criar este caminho). Cada engine deve ficar em sua própria pasta (ex: `.../bin/P-Slice Engine/`).
3.  Re-compilar a imagem do sistema executando `image/build_image.sh` para que os novos binários sejam incluídos no `cheerpXImage.ext2`.

---

## Networking para Multiplayer Online (Tailscale/Headscale)

Para usar funcionalidades online (como o multiplayer do NovaFlare), o CheerpX precisa se conectar à internet através de uma VPN.

1.  **O que é?**: Headscale é um servidor de controle auto-hospedado para a VPN Tailscale. Você precisará ter sua própria instância do Headscale rodando.
2.  **Configuração na UI**: Na tela inicial, insira a URL do seu servidor Headscale e uma chave de autenticação válida (`Auth Key`).
3.  **Configuração do Exit Node**: Para que a aplicação no navegador possa acessar a internet pública (e não apenas outros dispositivos na sua VPN), você **precisa** configurar um "exit node" na sua rede Tailscale/Headscale.
    -   Em um de seus dispositivos na rede (por exemplo, um servidor Linux), anuncie-o como um exit node com o comando:
        ```bash
        sudo tailscale up --advertise-exit-node
        ```
    -   Depois, você precisa habilitar o exit node no painel de administração do seu Headscale/Tailscale.
    -   Para mais detalhes, consulte a [documentação oficial do Tailscale sobre Exit Nodes](https://tailscale.com/kb/1103/exit-nodes/).
