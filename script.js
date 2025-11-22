// script.js
(async () => {
  // --- Constants and UI elements ---
  const cheerpxContainer = document.getElementById('cheerpx-container');
  const launcherUI = document.getElementById('launcher-ui');
  const engineSelectionContainer = document.getElementById('engine-selection-container');
  const displayCanvas = document.getElementById('display');
  const consolePre = document.getElementById('console');
  const fileExplorer = document.getElementById('file-explorer');
  const toggleExplorerButton = document.getElementById('toggle-explorer-button');
  const explorerContent = document.getElementById('explorer-content');
  const explorerPath = document.getElementById('explorer-path');
  const headscaleUrlInput = document.getElementById('headscale-url');
  const authKeyInput = document.getElementById('auth-key');

  const FNF_ENGINES = [
    {
      id: 'pslice',
      name: 'P-Slice Engine',
      description: 'Psych Engine fork with V-Slice features.',
      executablePath: '/usr/local/bin/P-Slice Engine/Funkin',
    },
    {
      id: 'vslice',
      name: 'V-Slice (Funkin)',
      description: 'The actively developed base game with PolyMod support.',
      executablePath: '/usr/local/bin/V-Slice (Funkin)/Funkin',
    },
    {
      id: 'psychonline',
      name: 'Psych Online',
      description: 'Psych Engine 0.7.3 with online multiplayer.',
      executablePath: '/usr/local/bin/Psych Online/Funkin',
    },
    {
      id: 'novaflare',
      name: 'NovaFlare Engine',
      description: 'Engine with online multiplayer support.',
      executablePath: '/usr/local/bin/NovaFlare Engine/Funkin',
    },
    {
      id: 'psych104',
      name: 'Psych Engine 1.0.4',
      description: 'Latest version of Psych Engine.',
      executablePath: '/usr/local/bin/Psych Engine 1.0.4/Funkin',
    },
    {
      id: 'psych073',
      name: 'Psych Engine 0.7.3',
      description: 'A stable and popular version of Psych Engine.',
      executablePath: '/usr/local/bin/Psych Engine 0.7.3/Funkin',
    },
    {
      id: 'psych063',
      name: 'Psych Engine 0.6.3',
      description: 'Classic version of Psych Engine.',
      executablePath: '/usr/local/bin/Psych Engine 0.6.3/Funkin',
    },
    {
      id: 'shadow',
      name: 'Shadow Engine',
      description: 'A modified version of Psych Engine 0.7.3.',
      executablePath: '/usr/local/bin/Shadow Engine/Funkin',
    },
    {
      id: 'codename',
      name: 'Codename Engine',
      description: 'A classic engine.',
      executablePath: '/usr/local/bin/Codename Engine/Funkin',
    },
    {
      id: 'default',
      name: 'Alpine X11 Shell',
      description: 'Launch a basic Alpine Linux shell for testing.',
      executablePath: '/usr/bin/xterm', // Fallback to xterm for testing
    },
  ];

  // --- State Variables ---
  let cx = null;
  let modsDevice = null;
  let currentEngine = null; 
  let currentExplorerPath = '/';
  let fnfPid = null;

  // --- Core Functions ---

  async function launchFnf() {
    if (!cx || !currentEngine) return;
    
    const engineData = FNF_ENGINES.find(e => e.id === currentEngine);
    if (!engineData) {
        console.error(`Engine data for ${currentEngine} not found!`);
        return;
    }

    console.log(`Launching ${engineData.name}...`);
    try {
        const result = await cx.run(engineData.executablePath, [], { 
            env: ['DISPLAY=:0'],
            background: true 
        });
        fnfPid = result.pid;
        console.log(`Process for ${engineData.name} started with PID: ${fnfPid}`);
    } catch (e) {
        console.error(`Failed to launch ${engineData.name}:`, e);
        consolePre.innerText += `\nFailed to launch ${engineData.name}. Is the executable at ${engineData.executablePath}?`;
    }
  }

  async function startEngine(engineId) {
    currentEngine = engineId;
    launcherUI.style.display = 'none';
    displayCanvas.style.display = 'block';
    consolePre.style.display = 'block';
    const displayWidth = cheerpxContainer.offsetWidth;
    const displayHeight = cheerpxContainer.offsetHeight;
    displayCanvas.width = displayWidth;
    displayCanvas.height = displayHeight;

    try {
      console.log("Initializing CheerpX...");
      const blockDevice = await CheerpX.HttpBytesDevice.create("/cheerpXImage.ext2");
      const overlayDevice = await CheerpX.OverlayDevice.create(blockDevice, await CheerpX.IDBDevice.create("block1"));
      modsDevice = await CheerpX.IDBDevice.create("fnf_mods");

      const cheerpxOptions = {
        mounts: [
          { type: "ext2", path: "/", dev: overlayDevice },
          { type: "dir", path: "/mods", dev: modsDevice },
          { type: "devs", path: "/dev" },
        ],
      };

      const headscaleUrl = headscaleUrlInput.value.trim();
      const authKey = authKeyInput.value.trim();

      if (headscaleUrl && authKey) {
        console.log(`Connecting to Headscale server: ${headscaleUrl}`);
        cheerpxOptions.networkInterface = {
          authKey: authKey,
          controlUrl: headscaleUrl,
          stateUpdateCb: (state) => {
            console.log("Network state changed to:", state);
          },
          netmapUpdateCb: (map) => {
            console.log("Network mapping updated:", map);
          },
        };
      } else {
        console.log("No network configuration provided. Starting without networking.");
      }

      cx = await CheerpX.Linux.create(cheerpxOptions);

      cx.setConsole(consolePre);
      cx.setKmsCanvas(displayCanvas, displayWidth, displayHeight);

      console.log("Starting Xorg...");
      await cx.run("/usr/bin/Xorg", ["-retro"]);
      console.log("CheerpX and Xorg started.");

      if(cheerpxOptions.networkInterface) {
        console.log("Attempting network login...");
        await cx.networkLogin();
      }

      await launchFnf();

      alert("CheerpX is ready. Drag and drop a mod .zip file to install it.");
      await renderExplorer(currentExplorerPath);

    } catch (error) {
      console.error("CheerpX initialization failed:", error);
      consolePre.innerText = `Error: ${error.message}\n\nCheck browser console for details.`;
    }
  }
  
  async function restartFnfProcess() {
      console.log("Restarting FNF process...");
      if (fnfPid) {
          try {
            await cx.run('/bin/kill', [fnfPid.toString()]);
            console.log(`Killed process ${fnfPid}`);
          } catch(e) {
            console.warn(`Could not kill process ${fnfPid}, it might have already finished.`, e);
          }
          fnfPid = null;
      }
      await launchFnf();
      console.log("FNF process restarted.");
      alert("Mod installed, FNF restarted.");
  }

  // --- UI and Event Handlers ---

  function populateEngineSelector() {
    engineSelectionContainer.innerHTML = ''; // Clear existing
    for (const engine of FNF_ENGINES) {
        const card = document.createElement('div');
        card.className = 'engine-card';
        card.dataset.engineId = engine.id;
        
        const title = document.createElement('h2');
        title.textContent = engine.name;
        
        const description = document.createElement('p');
        description.textContent = engine.description;
        
        card.appendChild(title);
        card.appendChild(description);
        
        card.addEventListener('click', () => startEngine(engine.id));
        engineSelectionContainer.appendChild(card);
    }
  }

  toggleExplorerButton.addEventListener('click', () => {
    fileExplorer.classList.toggle('open');
  });

  document.body.addEventListener('dragover', (event) => event.preventDefault());

  document.body.addEventListener('drop', async (event) => {
    event.preventDefault();
    if (!cx) {
      alert("Please start an engine before dropping a mod!");
      return;
    }
    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    if (fileExplorer.contains(event.target)) { // Advanced Mode
        console.log("Advanced Mode Drop detected.");
        const writePromises = [];
        for (const file of files) {
            const targetPath = (currentExplorerPath === '/' ? '' : currentExplorerPath) + '/' + file.name;
            console.log(`Uploading ${file.name} to ${targetPath}`);
            const promise = file.arrayBuffer().then(buffer => cx.writeFile(targetPath, new Uint8Array(buffer)));
            writePromises.push(promise);
        }
        try {
            await Promise.all(writePromises);
            alert(`${files.length} file(s) uploaded to ${currentExplorerPath}`);
            await renderExplorer(currentExplorerPath);
        } catch(e) {
            console.error("Advanced drop failed:", e);
            alert(`Error uploading files: ${e.message}`);
        }
    } else { // Easy Mode
        if (!modsDevice) {
            alert("Mods device not ready!");
            return;
        }
        const modFile = files[0];
        if (!modFile.name.endsWith('.zip')) {
            alert("Easy mode: Please drop a single .zip file to install a mod.");
            return;
        }
        await installMod(modFile);
    }
  });

  // --- File System and Mod Installation Logic ---

  async function renderExplorer(path) {
    if (!cx) return;
    const sanitizedPath = path.replace(/"/g, '\\"');
    let outputString = "";
    try {
        const lines = [];
        const oldConsole = cx.setCustomConsole(buf => lines.push(new TextDecoder().decode(buf)));
        const result = await cx.run('/bin/ls', ['-F', sanitizedPath]);
        cx.setCustomConsole(oldConsole);
        outputString = result.code === 0 ? lines.join('') : `Error listing directory. Code: ${result.code}`;
    } catch (e) {
        outputString = `Error: ${e.message}`;
        console.error(e);
    }
    
    explorerPath.textContent = path;
    explorerContent.innerHTML = '';
    const list = document.createElement('ul');
    
    if (path !== '/') {
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const upItem = document.createElement('li');
        upItem.textContent = '..';
        upItem.className = 'dir-item';
        upItem.addEventListener('click', () => renderExplorer(parentPath));
        list.appendChild(upItem);
    }

    const items = outputString.split('\n').filter(i => i.trim() !== '');
    items.forEach(item => {
      const li = document.createElement('li');
      const itemName = item.replace(/\/$/, '');
      li.textContent = itemName;
      
      if (item.endsWith('/')) {
        li.className = 'dir-item';
        li.addEventListener('click', () => renderExplorer((path === '/' ? '' : path) + '/' + itemName));
      } else {
        li.className = 'file-item';
      }
      list.appendChild(li);
    });
    
    explorerContent.appendChild(list);
    currentExplorerPath = path;
  }
  
  async function extractAndWriteZip(zip, targetVmPath, device) {
      const directories = new Set();
      const filesToWrite = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          const fullPath = `${targetVmPath}/${relativePath}`;
          if (zipEntry.dir) {
              directories.add(fullPath);
          } else {
              const dirName = fullPath.substring(0, fullPath.lastIndexOf('/'));
              if(dirName) directories.add(dirName);
              filesToWrite.push({
                  path: fullPath,
                  content: await zipEntry.async("uint8array")
              });
          }
      }

      console.log("Creating directories...");
      for (const dir of directories) {
          await cx.run('/bin/mkdir', ['-p', `/mods${dir}`]);
      }

      console.log("Writing files...");
      const writePromises = filesToWrite.map(file => {
          const devicePath = file.path.startsWith(targetVmPath) ? file.path.substring(targetVmPath.length) : file.path;
          return device.writeFile(devicePath, file.content);
      });
      await Promise.all(writePromises);
  }

  async function installMod(modFile) {
    console.log(`Installing mod for engine: ${currentEngine}`);
    const modName = modFile.name.replace('.zip', '');
    const targetVmPath = `/${modName}`;

    try {
        const zip = await JSZip.loadAsync(modFile);
        
        switch (currentEngine) {
            case 'vslice':
                console.log("V-Slice engine: checking zip structure...");
                const keyFolders = ['data', 'images', 'songs', 'scripts'];
                let rootFolder = null;
                
                for (const filename in zip.files) {
                    const parts = filename.split('/');
                    if (parts.length > 1 && keyFolders.includes(parts[1])) {
                        rootFolder = zip.folder(parts[0]);
                        console.log(`Found mod root in sub-folder: ${parts[0]}`);
                        break;
                    } else if (keyFolders.includes(parts[0])) {
                        rootFolder = zip;
                        console.log("Mod root is at zip's top level.");
                        break;
                    }
                }
                
                if (rootFolder) {
                    await extractAndWriteZip(rootFolder, targetVmPath, modsDevice);
                } else {
                    throw new Error("Could not determine mod's root directory. No 'data', 'images', etc. folders found.");
                }
                break;
            
            case 'psych':
            case 'codename':
            case 'pslice':
            default:
                console.log("Standard engine: extracting zip directly.");
                await extractAndWriteZip(zip, targetVmPath, modsDevice);
                break;
        }

        console.log(`Mod '${modName}' installed successfully! Find it in /mods.`);
        await renderExplorer('/mods');
        await restartFnfProcess();

    } catch (error) {
        console.error("Mod installation failed:", error);
        alert(`Failed to install mod: ${error.message}`);
    }
  }

  // --- Initializer ---
  populateEngineSelector();

})();
