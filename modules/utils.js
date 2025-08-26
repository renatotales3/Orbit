const Utils = (() => { 
const loadFromLocalStorage = (key, defaultValue) => { 
try { 
const item = localStorage.getItem(key); 
return item ? JSON.parse(item) : defaultValue; 
} catch { return defaultValue; } 
}; 
return { loadFromLocalStorage }; 
})();
