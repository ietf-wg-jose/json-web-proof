let fs = require('fs');
let path = require('path');
let jp = require('jsonpath');

let formats = ["json", "text"];
let args = process.argv.slice(2);

// validate and load markdown source
let md_file = args[0];
if(!md_file) err(`first argument must be a markdown file`);
if(!fs.existsSync(md_file)) err(`markdown file '${md_file}' not found`);
if(path.extname(md_file) != '.md') err(`markdown file must have a .md extension`);
let md_contents = fs.readFileSync(md_file).toString();
if(!md_contents) err(`unable to read from '${md_file}'`);
if(md_contents.indexOf('\r') >= 0) err(`carriage returns are not supported`);
let md_lines = md_contents.split('\n');
if(md_lines.length < 2) err(`not enough lines in markdown`);

// validate and load the JSON fixtures for the given markdown file
let fix_file = path.join(path.dirname(md_file), 'fixtures', path.basename(md_file, '.md') + '.json');
if(!fs.existsSync(fix_file)) err(`json fixtures file '${fix_file}' not found`);
let fix_contents = fs.readFileSync(fix_file);
if(!fix_contents) err(`unable to read from '${fix_file}'`);
let fixtures = {};
try
{
    fixtures = JSON.parse(fix_contents);
}catch(e){
    err(`error parsing '${fix_file}': ${e}`);
}
if(fixtures == null || typeof fixtures != 'object' || Array.isArray(fixtures)) err(`fixtures must be an object`);

// process all the lines
let md_out = [];
let fix_count = 0;
let fixture = null;
let line_count = 1;
md_lines.forEach(function(line){
    line_count++;

    // in fixing mode
    if(fixture)
    {
        // drop lines until closing back-ticks
        if(line != '```') return;

        // do replacement
        md_out.push(fixture);
        fixture = null;
        fix_count++;
        md_out.push(line);
        return;
    }

    // detect new fixing block
    if(line.substring(0,3) == '```' && (sep = line.indexOf(' ')) > 0)
    {
        let query = line.substring(sep+1);
        let res = jp.query(fixtures, query);
        if(res.length == 0) return err(`fixture not found for '${query}' at line ${line_count}:${line}`);
        if(res.length > 1) return err(`multiple fixtures found for '${query}' at line ${line_count}:${line}`);

        let format = line.substring(3,sep);
        switch(formats.indexOf(format))
        {
            case 0: // json
                if(Array.isArray(res[0]))
                {
                    fixture = JSON.stringify(res[0]).split(',').join(', ').split('],').join('],\n').split(']]').join(']\n]').split('[[').join('[\n [');
                    break;
                }
                if(typeof res[0] != 'object') return err(`fixture is '${typeof res[0]}', expected object at ${line_count}:${line}`);
                fixture = JSON.stringify(res[0], 0, 2);
                break;
            case 1: // text
                if(typeof res[0] != 'string') return err(`fixture is '${typeof res[0]}', expected string at ${line_count}:${line}`);
                fixture = res[0];
                break;
            default:
                return err(`unknown format '${format}' at line ${line_count}:${line}`);
        }
    }

    md_out.push(line);
});

// save back the file
if(fix_count == 0) err(`no fixtures found`);
fs.writeFileSync(md_file, md_out.join('\n'));
console.log(`successfully replaced ${fix_count} fixtures`);

function err(log)
{
    console.log(log);
    process.exit(1);
}