"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServices = initServices;
var firebase_ts_1 = require("../firebase.ts");
var firestore_1 = require("firebase/firestore");
// ====== Default Services ======
var defaultServices = [
    { id: 'token', title: 'Token Creation', description: 'Create crypto token', price: '$100', category: 'Crypto', icon: '🪙', isActive: true },
    { id: 'website', title: 'Website Development', description: 'Build website', price: '$200', category: 'Web', icon: '🌐', isActive: true },
    { id: 'chatbot', title: 'Chatbot Development', description: 'Custom chatbot', price: '$150', category: 'Automation', icon: '🤖', isActive: true },
    { id: 'mlm', title: 'MLM Platform', description: 'Design MLM system', price: '$500', category: 'Business', icon: '📈', isActive: true },
    { id: 'mobile', title: 'Mobile App', description: 'iOS/Android app', price: '$300', category: 'App', icon: '📱', isActive: true },
    { id: 'automation', title: 'Automation', description: 'Automate processes', price: '$100', category: 'Automation', icon: '⚙️', isActive: true },
    { id: 'telegram', title: 'Telegram Bot', description: 'Custom telegram bot', price: '$80', category: 'Bot', icon: '💬', isActive: true },
    { id: 'audit', title: 'Audit', description: 'Smart contract or token audit', price: '$200', category: 'Security', icon: '🛡️', isActive: true },
];
// ====== Default Forms ======
var defaultForms = {
    token: [
        { title: 'Basic Info', fields: [{ name: 'tokenName', label: 'Token Name', type: 'text' }, { name: 'tokenSymbol', label: 'Token Symbol', type: 'text' }] },
        { title: 'Token Details', fields: [
                { name: 'tokenType', label: 'Token Type', type: 'select', options: ['ERC-20', 'BEP-20', 'Custom Blockchain'] },
                { name: 'totalSupply', label: 'Total Supply', type: 'number' },
                { name: 'decimals', label: 'Decimals', type: 'number' },
                { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', options: ['Burnable', 'Mintable', 'Staking', 'Governance'] },
                { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'network', label: 'Blockchain Network Preference', type: 'select', options: ['Ethereum', 'Binance Smart Chain', 'Polygon', 'Other'] },
                { name: 'auditRequired', label: 'Audit Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    website: [
        { title: 'Website Info', fields: [
                { name: 'websiteType', label: 'Website Type', type: 'select', options: ['Corporate', 'Ecommerce', 'Portfolio', 'Blog'] },
                { name: 'pages', label: 'Number of Pages', type: 'number' },
                { name: 'cms', label: 'CMS Integration?', type: 'select', options: ['Yes', 'No'] },
                { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'hostingDomain', label: 'Hosting/Domain Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'preferredTech', label: 'Preferred Technology', type: 'select', options: ['React', 'Next.js', 'WordPress', 'Other'] },
                { name: 'seoOptimization', label: 'SEO Optimization?', type: 'select', options: ['Yes', 'No'] },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    chatbot: [
        { title: 'Chatbot Info', fields: [
                { name: 'platform', label: 'Platform', type: 'select', options: ['Website', 'Telegram', 'WhatsApp', 'Multi-platform'] },
                { name: 'purpose', label: 'Purpose', type: 'select', options: ['Customer Support', 'Lead Generation', 'Automation'] },
                { name: 'usersExpected', label: 'Number of Users Expected', type: 'number' },
                { name: 'languages', label: 'Languages Supported', type: 'text' },
                { name: 'customCommands', label: 'Custom Commands Needed?', type: 'select', options: ['Yes', 'No'] },
                { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    mlm: [
        { title: 'MLM Plan Info', fields: [
                { name: 'planType', label: 'Plan Type', type: 'select', options: ['Binary', 'Matrix', 'Unilevel', 'Hybrid'] },
                { name: 'usersCount', label: 'Users Count', type: 'number' },
                { name: 'compensation', label: 'Compensation Plan Features', type: 'checkbox', options: ['Direct', 'Matching', 'Pool', 'Rank Bonus'] },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    mobile: [
        { title: 'Mobile App Info', fields: [
                { name: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'Cross-platform'] },
                { name: 'appType', label: 'Type', type: 'select', options: ['Native', 'Hybrid', 'PWA'] },
                { name: 'screens', label: 'Number of Screens', type: 'number' },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    automation: [
        { title: 'Automation Info', fields: [
                { name: 'processes', label: 'Processes to Automate', type: 'text' },
                { name: 'integrations', label: 'Integration Required', type: 'text' },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    telegram: [
        { title: 'Telegram Bot Info', fields: [
                { name: 'commands', label: 'Custom Commands', type: 'text' },
                { name: 'apiIntegration', label: 'API Integration', type: 'select', options: ['Yes', 'No'] },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
    audit: [
        { title: 'Audit Info', fields: [
                { name: 'auditType', label: 'Audit Type', type: 'select', options: ['Smart Contract', 'Token', 'Protocol'] },
                { name: 'scope', label: 'Scope', type: 'text' },
                { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
            ] }
    ],
};
// ====== Main Function ======
function initServices() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, defaultServices_1, service, _a, _b, _c, serviceId, steps, err_1;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log('Initializing default services...');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 10, , 11]);
                    _i = 0, defaultServices_1 = defaultServices;
                    _e.label = 2;
                case 2:
                    if (!(_i < defaultServices_1.length)) return [3 /*break*/, 5];
                    service = defaultServices_1[_i];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_ts_1.firestore, 'services', service.id), {
                            title: service.title,
                            description: service.description,
                            category: service.category,
                            icon: service.icon,
                            price: service.price,
                            isActive: (_d = service.isActive) !== null && _d !== void 0 ? _d : true,
                            createdAt: (0, firestore_1.serverTimestamp)(),
                        })];
                case 3:
                    _e.sent();
                    console.log("Added service: ".concat(service.title));
                    _e.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    _a = 0, _b = Object.entries(defaultForms);
                    _e.label = 6;
                case 6:
                    if (!(_a < _b.length)) return [3 /*break*/, 9];
                    _c = _b[_a], serviceId = _c[0], steps = _c[1];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_ts_1.firestore, 'serviceForms', serviceId), { steps: steps })];
                case 7:
                    _e.sent();
                    console.log("Added form for service: ".concat(serviceId));
                    _e.label = 8;
                case 8:
                    _a++;
                    return [3 /*break*/, 6];
                case 9:
                    console.log('✅ All services and forms initialized successfully.');
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _e.sent();
                    console.error('❌ Failed to initialize services:', err_1);
                    throw err_1; // Re-throw to trigger error handling in SeederButton
                case 11: return [2 /*return*/];
            }
        });
    });
}
