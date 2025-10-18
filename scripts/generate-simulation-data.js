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
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function generateSimulationData() {
    return __awaiter(this, void 0, void 0, function () {
        var sectors, stages, now, startups, i, daysAgo, timestamp, baseSSE, seasonalBoost, batchSize, i, batch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🎲 Generating 10,000 startup simulations...');
                    sectors = ['AI/ML', 'Fintech', 'Healthcare', 'EdTech', 'CleanTech', 'SaaS', 'Cybersecurity'];
                    stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'];
                    now = new Date();
                    startups = [];
                    for (i = 0; i < 10000; i++) {
                        daysAgo = Math.floor(Math.random() * 365);
                        timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                        baseSSE = 30 + Math.floor(Math.random() * 60);
                        seasonalBoost = Math.sin((daysAgo / 365) * Math.PI * 2) * 10;
                        startups.push({
                            userId: "sim_user_".concat(i),
                            companyName: "Startup ".concat(i),
                            industry: sectors[Math.floor(Math.random() * sectors.length)],
                            stage: stages[Math.floor(Math.random() * stages.length)],
                            foundedDate: new Date(timestamp.getTime() - Math.random() * 730 * 24 * 60 * 60 * 1000),
                            sseScore: Math.round(baseSSE + seasonalBoost),
                            sseScoreHistory: '[]',
                            mrr: Math.floor(10000 + Math.random() * 200000),
                            arr: 0,
                            growthRate: 5 + Math.random() * 45,
                            burnRate: Math.floor(5000 + Math.random() * 95000),
                            runway: Math.floor(6 + Math.random() * 30),
                            employees: Math.floor(3 + Math.random() * 150),
                            customers: Math.floor(10 + Math.random() * 5000),
                            lastMetricsUpdate: timestamp,
                            createdAt: timestamp,
                        });
                    }
                    console.log('💾 Inserting into database (batched)...');
                    batchSize = 1000;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < startups.length)) return [3 /*break*/, 4];
                    batch = startups.slice(i, i + batchSize);
                    return [4 /*yield*/, prisma.startupProfile.createMany({
                            data: batch,
                        })];
                case 2:
                    _a.sent();
                    console.log("  \u2705 Batch ".concat(Math.floor(i / batchSize) + 1, "/").concat(Math.ceil(startups.length / batchSize)));
                    _a.label = 3;
                case 3:
                    i += batchSize;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('✅ 10,000 startups generated!');
                    return [2 /*return*/];
            }
        });
    });
}
generateSimulationData()
    .catch(console.error)
    .finally(function () { return prisma.$disconnect(); });
