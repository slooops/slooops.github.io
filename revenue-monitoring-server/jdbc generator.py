def generate_jdbc_setup(query_name):
    # Extract the base name for the query to be used in different formats
    base_name = query_name.lower().replace("_query", "")
    camel_case_parts = [word.capitalize() for word in base_name.split('_')]
    camel_case_name = camel_case_parts[0].lower(
    ) + ''.join(camel_case_parts[1:])
    formatted_base_name = base_name.replace('_', '.')

    # Part 1: env.json
    env_json = f'"{query_name}": "select ... from ..."'

    # Part 2: queries.properties
    queries_properties = f'{formatted_base_name}.q = ${{{query_name}}}'

    # Part 3: QueryConfigs.java
    query_configs_java = f'''
    @Value(("${{{formatted_base_name}.q}}"))
    public String {camel_case_name};

    @Bean( name = "{camel_case_name}" )
    public String get{camel_case_name[0].upper() + camel_case_name[1:]}() {{return this.{camel_case_name}; }}
    '''

    # Part 4: Service (moved before Controller as per the request)
    service = f'''
    private String {camel_case_name};

    // Constructor or setter
    this.{camel_case_name} = {camel_case_name};

    public List<Map<String, Object>> get{camel_case_name[0].upper() + camel_case_name[1:]}() {{
        return jdbcManager.queryForList({camel_case_name});
    }}
    '''

    # Part 5: Controller (swapped with Service)
    controller = f'''
    @GetMapping("/{base_name.replace('_', '-')}")
    public ResponseEntity<List<Map<String, Object>>> get{camel_case_name[0].upper() + camel_case_name[1:]}() {{
        return new ResponseEntity<>(service.get{camel_case_name[0].upper() + camel_case_name[1:]}(), HttpStatus.OK);
    }}
    '''

    # Part 6: HTTP GET Request for Angular
    http_get_request = f'''
    //for ngOnInit
    this.get{camel_case_name[0].upper() + camel_case_name[1:]}();

    get{camel_case_name[0].upper() + camel_case_name[1:]}() {{
        this.http.get('{base_name.replace('_', '-')}').subscribe((data: any) => {{
            console.log('{camel_case_name}:', data);
        }});
    }}
    '''

    # Output each part
    print("Part 1: env.json\n", env_json, "\n")
    print("Part 2: queries.properties\n", queries_properties, "\n")
    print("Part 3: QueryConfigs.java\n", query_configs_java, "\n")
    print("Part 4: Service\n", service, "\n")
    print("Part 5: Controller\n", controller, "\n")
    print("Part 6: HTTP GET Request\n", http_get_request, "\n")


# Example usage
generate_jdbc_setup("")
generate_jdbc_setup("")
