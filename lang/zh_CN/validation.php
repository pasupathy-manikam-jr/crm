<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => '必须接受 :attribute。',
    'accepted_if' => '当 :other 为 :value 时，必须接受 :attribute。',
    'active_url' => ':attribute 必须是有效的网址。',
    'after' => ':attribute 必须是 :date 之后的日期。',
    'after_or_equal' => ':attribute 必须是 :date 或之后的日期。',
    'alpha' => ':attribute 只能包含字母。',
    'alpha_dash' => ':attribute 只能包含字母、数字、短横线和下划线。',
    'alpha_num' => ':attribute 只能包含字母和数字。',
    'any_of' => ':attribute 无效。',
    'array' => ':attribute 必须是数组。',
    'array_keys' => ':attribute 只能包含以下键：:values。',
    'ascii' => ':attribute 只能包含单字节的字母数字字符和符号。',
    'base64' => ':attribute 必须是有效的 Base64 字符串。',
    'before' => ':attribute 必须是 :date 之前的日期。',
    'before_or_equal' => ':attribute 必须是 :date 或之前的日期。',
    'between' => [
        'array' => ':attribute 必须包含 :min 至 :max 个项目。',
        'file' => ':attribute 必须介于 :min 至 :max KB 之间。',
        'numeric' => ':attribute 必须介于 :min 至 :max 之间。',
        'string' => ':attribute 必须介于 :min 至 :max 个字符之间。',
    ],
    'boolean' => ':attribute 必须为 true 或 false。',
    'can' => ':attribute 包含未经授权的值。',
    'confirmed' => ':attribute 确认不匹配。',
    'contains' => ':attribute 缺少必需的值。',
    'current_password' => '密码不正确。',
    'date' => ':attribute 必须是有效的日期。',
    'date_equals' => ':attribute 必须是等于 :date 的日期。',
    'date_format' => ':attribute 必须符合 :format 格式。',
    'decimal' => ':attribute 必须有 :decimal 位小数。',
    'declined' => '必须拒绝 :attribute。',
    'declined_if' => '当 :other 为 :value 时，必须拒绝 :attribute。',
    'different' => ':attribute 和 :other 必须不同。',
    'digits' => ':attribute 必须是 :digits 位数字。',
    'digits_between' => ':attribute 必须介于 :min 至 :max 位数字之间。',
    'dimensions' => ':attribute 的图片尺寸无效。',
    'distinct' => ':attribute 存在重复值。',
    'doesnt_contain' => ':attribute 不能包含以下任何一项：:values。',
    'doesnt_end_with' => ':attribute 不能以下列任何一项结尾：:values。',
    'doesnt_start_with' => ':attribute 不能以下列任何一项开头：:values。',
    'email' => ':attribute 必须是有效的电子邮件地址。',
    'encoding' => ':attribute 必须使用 :encoding 编码。',
    'ends_with' => ':attribute 必须以下列其中一项结尾：:values。',
    'enum' => '所选的 :attribute 无效。',
    'exists' => '所选的 :attribute 无效。',
    'extensions' => ':attribute 的扩展名必须是以下其中之一：:values。',
    'file' => ':attribute 必须是文件。',
    'filled' => ':attribute 不能为空。',
    'gt' => [
        'array' => ':attribute 必须包含多于 :value 个项目。',
        'file' => ':attribute 必须大于 :value KB。',
        'numeric' => ':attribute 必须大于 :value。',
        'string' => ':attribute 必须多于 :value 个字符。',
    ],
    'gte' => [
        'array' => ':attribute 必须包含 :value 个或以上的项目。',
        'file' => ':attribute 必须大于或等于 :value KB。',
        'numeric' => ':attribute 必须大于或等于 :value。',
        'string' => ':attribute 必须至少为 :value 个字符。',
    ],
    'hex_color' => ':attribute 必须是有效的十六进制颜色代码。',
    'image' => ':attribute 必须是图片。',
    'in' => '所选的 :attribute 无效。',
    'in_array' => ':attribute 必须存在于 :other 中。',
    'in_array_keys' => ':attribute 必须至少包含以下其中一个键：:values。',
    'integer' => ':attribute 必须是整数。',
    'ip' => ':attribute 必须是有效的 IP 地址。',
    'ipv4' => ':attribute 必须是有效的 IPv4 地址。',
    'ipv6' => ':attribute 必须是有效的 IPv6 地址。',
    'json' => ':attribute 必须是有效的 JSON 字符串。',
    'list' => ':attribute 必须是列表。',
    'lowercase' => ':attribute 必须为小写。',
    'lt' => [
        'array' => ':attribute 必须包含少于 :value 个项目。',
        'file' => ':attribute 必须小于 :value KB。',
        'numeric' => ':attribute 必须小于 :value。',
        'string' => ':attribute 必须少于 :value 个字符。',
    ],
    'lte' => [
        'array' => ':attribute 不能包含多于 :value 个项目。',
        'file' => ':attribute 必须小于或等于 :value KB。',
        'numeric' => ':attribute 必须小于或等于 :value。',
        'string' => ':attribute 不能多于 :value 个字符。',
    ],
    'mac_address' => ':attribute 必须是有效的 MAC 地址。',
    'max' => [
        'array' => ':attribute 不能包含多于 :max 个项目。',
        'file' => ':attribute 不能大于 :max KB。',
        'numeric' => ':attribute 不能大于 :max。',
        'string' => ':attribute 不能多于 :max 个字符。',
    ],
    'max_digits' => ':attribute 不能多于 :max 位数字。',
    'mimes' => ':attribute 必须是以下类型的文件：:values。',
    'mimetypes' => ':attribute 必须是以下类型的文件：:values。',
    'min' => [
        'array' => ':attribute 必须至少包含 :min 个项目。',
        'file' => ':attribute 必须至少为 :min KB。',
        'numeric' => ':attribute 必须至少为 :min。',
        'string' => ':attribute 必须至少为 :min 个字符。',
    ],
    'min_digits' => ':attribute 必须至少为 :min 位数字。',
    'missing' => ':attribute 必须不存在。',
    'missing_if' => '当 :other 为 :value 时，:attribute 必须不存在。',
    'missing_unless' => '除非 :other 为 :value，否则 :attribute 必须不存在。',
    'missing_with' => '当 :values 存在时，:attribute 必须不存在。',
    'missing_with_all' => '当 :values 都存在时，:attribute 必须不存在。',
    'multiple_of' => ':attribute 必须是 :value 的倍数。',
    'not_in' => '所选的 :attribute 无效。',
    'not_regex' => ':attribute 格式无效。',
    'numeric' => ':attribute 必须是数字。',
    'password' => [
        'letters' => ':attribute 必须至少包含一个字母。',
        'mixed' => ':attribute 必须至少包含一个大写字母和一个小写字母。',
        'numbers' => ':attribute 必须至少包含一个数字。',
        'symbols' => ':attribute 必须至少包含一个符号。',
        'uncompromised' => '所提供的 :attribute 已出现在数据泄露中，请选择其他 :attribute。',
    ],
    'present' => ':attribute 必须存在。',
    'present_if' => '当 :other 为 :value 时，:attribute 必须存在。',
    'present_unless' => '除非 :other 为 :value，否则 :attribute 必须存在。',
    'present_with' => '当 :values 存在时，:attribute 必须存在。',
    'present_with_all' => '当 :values 都存在时，:attribute 必须存在。',
    'prohibited' => '禁止填写 :attribute。',
    'prohibited_if' => '当 :other 为 :value 时，禁止填写 :attribute。',
    'prohibited_if_accepted' => '当 :other 已接受时，禁止填写 :attribute。',
    'prohibited_if_declined' => '当 :other 已拒绝时，禁止填写 :attribute。',
    'prohibited_unless' => '除非 :other 在 :values 中，否则禁止填写 :attribute。',
    'prohibits' => ':attribute 禁止 :other 同时存在。',
    'regex' => ':attribute 格式无效。',
    'required' => ':attribute 为必填项。',
    'required_array_keys' => ':attribute 必须包含以下条目：:values。',
    'required_if' => '当 :other 为 :value 时，:attribute 为必填项。',
    'required_if_accepted' => '当 :other 已接受时，:attribute 为必填项。',
    'required_if_declined' => '当 :other 已拒绝时，:attribute 为必填项。',
    'required_unless' => '除非 :other 在 :values 中，否则 :attribute 为必填项。',
    'required_with' => '当 :values 存在时，:attribute 为必填项。',
    'required_with_all' => '当 :values 都存在时，:attribute 为必填项。',
    'required_without' => '当 :values 不存在时，:attribute 为必填项。',
    'required_without_all' => '当 :values 都不存在时，:attribute 为必填项。',
    'same' => ':attribute 必须与 :other 一致。',
    'size' => [
        'array' => ':attribute 必须包含 :size 个项目。',
        'file' => ':attribute 必须为 :size KB。',
        'numeric' => ':attribute 必须为 :size。',
        'string' => ':attribute 必须为 :size 个字符。',
    ],
    'starts_with' => ':attribute 必须以下列其中一项开头：:values。',
    'string' => ':attribute 必须是字符串。',
    'timezone' => ':attribute 必须是有效的时区。',
    'unique' => ':attribute 已被使用。',
    'uploaded' => ':attribute 上传失败。',
    'uppercase' => ':attribute 必须为大写。',
    'url' => ':attribute 必须是有效的网址。',
    'ulid' => ':attribute 必须是有效的 ULID。',
    'uuid' => ':attribute 必须是有效的 UUID。',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'account_id' => '客户',
        'account_name' => '客户名称',
        'active' => '状态',
        'allowed_domains' => '允许的域名',
        'amount' => '金额',
        'billing_address' => '账单地址',
        'blocked_domains' => '屏蔽的域名',
        'body' => '内容',
        'cc' => '抄送',
        'company' => '公司',
        'contact_id' => '联系人',
        'date' => '日期',
        'deal_amount' => '商机金额',
        'deal_id' => '商机',
        'deal_name' => '商机名称',
        'description' => '描述',
        'due_at' => '截止时间',
        'email' => '电子邮件',
        'encryption' => '安全',
        'end_date' => '结束日期',
        'event' => '事件',
        'events' => '事件',
        'expected_close_date' => '预计成交日期',
        'file' => '文件',
        'first_name' => '名字',
        'folder' => '文件夹',
        'host' => 'IMAP 服务器',
        'industry' => '行业',
        'items' => '项目',
        'job_title' => '职位',
        'label' => '标签',
        'last_name' => '姓氏',
        'module' => '模块',
        'name' => '名称',
        'notes' => '备注',
        'notice_days' => '提醒天数',
        'number' => '编号',
        'owner_id' => '负责人',
        'password' => '密码',
        'phone' => '电话',
        'port' => '端口',
        'priority' => '优先级',
        'quote_id' => '报价单',
        'renewal_terms' => '续约条款',
        'role' => '角色',
        'shipping_address' => '收货地址',
        'sku' => 'SKU',
        'source' => '来源',
        'stage_id' => '阶段',
        'start_date' => '开始日期',
        'status' => '状态',
        'subject' => '主题',
        'tax_rate' => '税率',
        'team_id' => '团队',
        'to' => '收件人',
        'type' => '类型',
        'unit_price' => '单价',
        'url' => '网址',
        'username' => '用户名',
        'valid_until' => '有效期至',
        'value' => '价值',
        'website' => '网站',
    ],

];
