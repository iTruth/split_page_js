
function sp_container_info(childs, page_content_container, page_ctrl_container, item_pre_page = 20, page_num = 0) {
    this.childs = childs;
    this.item_pre_page = item_pre_page;
    this.page_num = page_num;
    this.page_content_container = page_content_container;
    this.page_ctrl_container = page_ctrl_container;
    this.page_nav_items_count = 5;
    this.page_nav_cur_page = 0;
    this.is_setup_page_nav = false;
    this.page_nav_items_container = null;
    this.page_nav = null;
    this.hidden_nav_input_ctrl_width = 700;
    this.on_page_changed = null;
}

let g_sp_data = new Map();
let g_sp_char_set = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

function sp_hash_string(str) {
    let ret = new Array(
        0x1e, 0x24, 0x35, 0x8a, 0x1d, 0x31, 0x9b, 0x11, 0x5 , 0x17, 0x99,
        0x22, 0x33, 0x66, 0x77, 0x53, 0x2c, 0xea, 0xae, 0x1a, 0x34, 0xa1,
        0xe1, 0x42, 0x53, 0xa8, 0xd1, 0x13, 0xb9, 0x11, 0x5 , 0x71, 0x99,
        0x22, 0x33, 0x66, 0x77, 0x35, 0xc2, 0xae, 0xea, 0xa1, 0x43, 0x1a
        );
    let ret_len = ret.length;
    let str_len = str.length;
    if(str_len > ret_len) {
        for(let i=0; i<str.length; ++i) {
            ret[i%ret_len] ^= str.charCodeAt(i);
        }
    }
    else {
        for(let i=0; i<ret_len; ++i) {
            ret[i] ^= str.charCodeAt(i%str_len);
        }
    }
    for(let i=0; i<ret_len; ++i) {
        ret[i] = g_sp_char_set[ret[i] % g_sp_char_set.length];
    }
    return ret.join("");
}

function sp_get_all_childs(container, node_type = 1) {
    let child = container.firstChild;
    let last = container.lastChild;
    let childs = new Array();
    for(;child != last; child = child.nextSibling) {
        if(child.nodeType === node_type) {
            childs.push(child);
        }
    }
    return childs;
}

function sp_sec_page_num(container, num) {
    let data = g_sp_data.get(container);
    let ret = num;
    if(num < 0) {
        ret = 0;
    }
    else {
        let max_page_num = Math.ceil(data.childs.length / data.item_pre_page) - 1;
        if(num > max_page_num) {
            ret = max_page_num;
        }
    }
    return ret;
}

function sp_id(id) {
    return document.getElementById(id);
}

function split_page_by_id(container_id, item_pre_page = 20) {
    return split_page(sp_id(container_id), item_pre_page);
}

function split_page(container, item_pre_page = 20) {
    let childs = sp_get_all_childs(container);
    let page_content_id = "split_page_id";
    if(container.id.length == 0) {
        page_content_id = sp_hash_string("page_content" + container.className + new Date());
    }
    else {
        page_content_id = container.id + "_split_page";
    }
    let page_ctrl_id = sp_hash_string("page_ctrl" + container.id + container.className + new Date());
    
    let split_page_div = document.createElement('div');
    split_page_div.id = page_content_id;

    let split_page_ctrl = document.createElement('div');
    split_page_ctrl.id = page_ctrl_id;

    let parent_node = container.parentNode;
    parent_node.replaceChild(split_page_div, container);

    split_page_div.appendChild(container);
    split_page_div.appendChild(split_page_ctrl);

    let container_info = new sp_container_info(childs, container, split_page_ctrl, item_pre_page);
    g_sp_data.set(container, container_info);

    setup_page_ctrl(container, 0);
    sp_load_content(container, 0);
    return container_info;
}

function sp_load_content(container, page_num) {
    let data = g_sp_data.get(container);
    data.page_num = sp_sec_page_num(container, page_num);
    sp_update_page_ctrl(container, data.page_num);
    data.page_content_container.innerHTML = '';
    for(let i=0; i<data.item_pre_page; ++i) {
        let cur_idx = data.page_num * data.item_pre_page + i;
        if(cur_idx > data.childs.length - 1) {
            break;
        }
        data.page_content_container.appendChild(data.childs[cur_idx]);
    }
    let page_changed_callback = data.on_page_changed;
    if(page_changed_callback != null) {
        page_changed_callback();
    }
}

function sp_to_previous_page(container) {
    let data = g_sp_data.get(container);
    sp_load_content(container, data.page_num - 1);
}

function sp_to_next_page(container) {
    let data = g_sp_data.get(container);
    sp_load_content(container, data.page_num + 1);
}

function sp_create_nav_btn(container, page_num) {
    let page_btn = document.createElement('button');
    page_btn.innerHTML = page_num + 1;
    page_btn.onclick = function() {
        sp_load_content(sp_id(container.id), page_num);
    }
    page_btn.className = 'page_nav_btn'
    return page_btn;
}

function sp_create_ignore_nav_btn(container) {
    let page_ignore_nav_btn = document.createElement('button');
    page_ignore_nav_btn.innerHTML = '...';
    page_ignore_nav_btn.className = 'page_nav_btn';
    page_ignore_nav_btn.onclick = function() {
        let raw_page_num = window.prompt('please enter the page number');
        let page_num = parseInt(raw_page_num);
        if(isNaN(page_num)) {
            return;
        }
        sp_load_content(container, page_num - 1);
    }
    return page_ignore_nav_btn;
}

function sp_update_page_ctrl(container, start_page) {
    let data = g_sp_data.get(container);
    data.page_nav_cur_page = start_page;
    let max_show_page = data.page_nav_items_count;
    let page_nav_items_container = data.page_nav_items_container;
    if(page_nav_items_container == null) {
        return;
    }
    page_nav_items_container.innerHTML = '';
    let max_page_num = Math.ceil(data.childs.length / data.item_pre_page) - 1;
    if(max_page_num + 2 > max_show_page + start_page) {
        let start_show_page = start_page;
        if(max_show_page / 2 < start_page) {
            start_show_page -= Math.floor(max_show_page / 2);
        }
        else {
            start_show_page = 0;
        }
        for(let i=start_show_page; i<start_show_page + max_show_page; ++i) {
            let page_btn = sp_create_nav_btn(container, i);
            if(i == start_page) {
                page_btn.className += ' page_nav_cur_btn';
            }
            page_nav_items_container.appendChild(page_btn);
        }
        if(max_show_page < max_page_num) {
            let ignore_nav_btn = sp_create_ignore_nav_btn(container);
            let last_page_nav_btn = sp_create_nav_btn(container, max_page_num);

            page_nav_items_container.appendChild(ignore_nav_btn);
            page_nav_items_container.appendChild(last_page_nav_btn);
        }
    }
    else {
        if(max_show_page < max_page_num) {
            let ignore_nav_btn = sp_create_ignore_nav_btn(container);
            let first_page_nav_btn = sp_create_nav_btn(container, 0);

            page_nav_items_container.appendChild(first_page_nav_btn);
            page_nav_items_container.appendChild(ignore_nav_btn);
            for(let i=max_page_num - max_show_page + 1; i<max_page_num + 1; ++i) {
                let page_btn = sp_create_nav_btn(container, i);
                if(i == start_page) {
                    page_btn.className += ' page_nav_cur_btn';
                }
                page_nav_items_container.appendChild(page_btn);
            }
        }
        else {
            for(let i=0; i<max_page_num + 1; ++i) {
                let page_btn = sp_create_nav_btn(container, i);
                if(i == start_page) {
                    page_btn.className += ' page_nav_cur_btn';
                }
                page_nav_items_container.appendChild(page_btn);
            }
        }
    }
}

function setup_page_ctrl(container, start_page = 0, max_show_page = 5) {
    let data = g_sp_data.get(container);
    let max_page_num = Math.ceil(data.childs.length / data.item_pre_page) - 1;
    if(start_page > max_show_page || max_page_num == 0) {
        return;
    }
    else {
        data.is_setup_page_nav = true;
    }
    data.page_nav_items_count = max_show_page;
    let page_nav = document.createElement('div');
    page_nav.className = 'page_nav_container';
    data.page_nav = page_nav;

    let page_nav_to_previous_page = document.createElement('button');
    page_nav_to_previous_page.onclick = function() {
        sp_to_previous_page(sp_id(container.id));
    }
    page_nav_to_previous_page.innerHTML = "<";
    page_nav_to_previous_page.className = 'page_nav page_nav_btn page_nav_ctrl_btn';

    let page_nav_to_next_page = document.createElement('button');
    page_nav_to_next_page.onclick = function() {
        sp_to_next_page(sp_id(container.id));
    }
    page_nav_to_next_page.innerHTML = ">";
    page_nav_to_next_page.className = 'page_nav page_nav_btn page_nav_ctrl_btn';

    page_nav.appendChild(page_nav_to_previous_page);

    let page_nav_items_container = document.createElement('div');
    page_nav_items_container.className = 'page_nav page_nav_items_container';
    data.page_nav_items_container = page_nav_items_container;
    page_nav.appendChild(page_nav_items_container);

    page_nav.appendChild(page_nav_to_next_page);

    let page_nav_input_ctrl = document.createElement('div');
    page_nav_input_ctrl.className = 'page_nav page_nav_items_container';
    let nav_text = document.createElement('span');
    nav_text.innerHTML = 'to';
    nav_text.className = 'page_nav';

    let nav_input = document.createElement('input');
    nav_input.type = 'text';
    nav_input.className = 'page_nav_input page_nav';

    let nav_btn = document.createElement('button');
    nav_btn.innerHTML = 'Go';
    nav_btn.className = 'page_nav page_nav_btn page_nav_ctrl_btn';
    window.onclick = function() {
        let val = parseInt(nav_input.value);
        if(isNaN(val)) {
            return;
        }
        val -= 1;
        sp_load_content(container, val);
    }

    page_nav_input_ctrl.appendChild(nav_text);
    page_nav_input_ctrl.appendChild(nav_input);
    page_nav_input_ctrl.appendChild(nav_btn);
    page_nav.appendChild(page_nav_input_ctrl);
    let resize_callback = function () {
        let devicewidth = document.documentElement.clientWidth;
        if (devicewidth > data.hidden_nav_input_ctrl_width) {
            page_nav_input_ctrl.style.display = 'flex';
        }
        else {
            page_nav_input_ctrl.style.display = 'none';
        }
    }
    window.addEventListener("resize", resize_callback);
    resize_callback();

    data.page_ctrl_container.appendChild(page_nav);
}
