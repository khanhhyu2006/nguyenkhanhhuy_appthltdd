document.querySelectorAll('[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
        if (!window.confirm('Xóa bản ghi này?')) event.preventDefault();
    });
});

const source = document.querySelector('[data-plan-source]');
const list = document.querySelector('[data-plan-list]');
const add = document.querySelector('[data-add-plan]');
if (source && list && add) {
    const fields = [
        ['name', 'Tên gói', 'text'],
        ['amount', 'Giá', 'number'],
        ['currency', 'Tiền tệ', ['VND', 'USD', 'EUR']],
        ['cycle', 'Chu kỳ', ['weekly', 'monthly', 'quarterly', 'yearly', 'custom']],
        ['custom_days', 'Số ngày', 'number'],
    ];
    const sync = () => {
        source.value = JSON.stringify([...list.children].map((row) => {
            const plan = Object.fromEntries([...row.querySelectorAll('[data-field]')].map((field) => [field.dataset.field, field.value]));
            return { ...plan, amount: Number(plan.amount), custom_days: plan.custom_days ? Number(plan.custom_days) : null };
        }));
    };
    const append = (plan = {}) => {
        const row = document.createElement('div');
        row.className = 'plan-row';
        for (const [key, title, type] of fields) {
            const label = document.createElement('label');
            label.textContent = title;
            const field = document.createElement(Array.isArray(type) ? 'select' : 'input');
            field.dataset.field = key;
            if (Array.isArray(type)) {
                const options = plan[key] ? [...new Set([...type, plan[key]])] : type;
                for (const choice of options) field.add(new Option(choice, choice));
            } else {
                field.type = type;
                if (key === 'amount') { field.min = '0'; field.step = '0.01'; }
                if (key === 'custom_days') { field.min = '1'; field.max = '999'; }
            }
            if (plan[key] != null) field.value = plan[key];
            if (key === 'cycle' && !plan.cycle) field.value = 'monthly';
            if (key === 'name' || key === 'amount') field.required = true;
            field.addEventListener('input', sync);
            label.append(field);
            row.append(label);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Bỏ gói';
        remove.addEventListener('click', () => { row.remove(); sync(); });
        row.append(remove);
        list.append(row);
    };
    let plans;
    try { plans = JSON.parse(source.value || '[]'); } catch { plans = null; }
    if (Array.isArray(plans) && plans.every((plan) => plan && typeof plan === 'object' && !Array.isArray(plan))) {
        plans.forEach(append);
        source.hidden = true;
        add.hidden = false;
        add.addEventListener('click', () => { append(); sync(); });
        source.form.addEventListener('submit', sync);
    }
}
