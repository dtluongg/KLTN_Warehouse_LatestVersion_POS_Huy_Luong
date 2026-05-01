const fs = require('fs');
const path = 'f:/KLTN/KLTN_Warehouse_LatestVersion_POS_Huy_Luong/frontend/src/features/purchase-orders/screens/PurchaseOrderFormScreen.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace('Modal,', 'Modal, Switch,');

txt = txt.replace(
    'const [surchargeAmount, setSurchargeAmount] = useState<string>("0");\r\n    const [items, setItems] = useState<LineItem[]>([]);',
    'const [surchargeAmount, setSurchargeAmount] = useState<string>("0");\r\n    const [allowOverReceipt, setAllowOverReceipt] = useState<boolean>(false);\r\n    const [items, setItems] = useState<LineItem[]>([]);'
);
txt = txt.replace(
    'const [surchargeAmount, setSurchargeAmount] = useState<string>("0");\n    const [items, setItems] = useState<LineItem[]>([]);',
    'const [surchargeAmount, setSurchargeAmount] = useState<string>("0");\n    const [allowOverReceipt, setAllowOverReceipt] = useState<boolean>(false);\n    const [items, setItems] = useState<LineItem[]>([]);'
);

txt = txt.replace(
    'setStatus(d.status || "DRAFT");',
    'setAllowOverReceipt(Boolean(d.allowOverReceipt));\n                setStatus(d.status || "DRAFT");'
);

txt = txt.replace(
    'surchargeAmount: Number(surchargeAmount) || 0,\r\n            items: items.map(it => ({',
    'surchargeAmount: Number(surchargeAmount) || 0,\r\n            allowOverReceipt,\r\n            items: items.map(it => ({'
);
txt = txt.replace(
    'surchargeAmount: Number(surchargeAmount) || 0,\n            items: items.map(it => ({',
    'surchargeAmount: Number(surchargeAmount) || 0,\n            allowOverReceipt,\n            items: items.map(it => ({'
);

txt = txt.replace(
    '<Text style={styles.label}>Ghi ch?</Text>',
    `<View style={styles.switchRow}>\n                        <View style={{ flex: 1 }}>\n                            <Text style={styles.label}>Cho phép nh?p vu?t s? lu?ng</Text>\n                            <Text style={styles.helperText}>Cho phép kho nh?p s? lu?ng th?c t? l?n h?n s? lu?ng d?t mua.</Text>\n                        </View>\n                        <Switch\n                            value={allowOverReceipt}\n                            onValueChange={setAllowOverReceipt}\n                            disabled={!canEdit}\n                            trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}\n                            thumbColor={allowOverReceipt ? '#16a3a4' : '#f3f4f6' }\n                        />\n                    </View>\n\n                    <Text style={styles.label}>Ghi chú</Text>`\n
);

txt = txt.replace(
    'picker: {',
    'switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 8 },\n    helperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2, paddingRight: 16 },\n\n    picker: {'
);

fs.writeFileSync(path, txt);
console.log('Done');

