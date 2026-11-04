OS.addModule({
  id: 'bash',
  num: 12,
  group: 'lab',
  title: 'Bash Scripting',
  titleRu: 'Скрипты на Bash',
  icon: '📜',
  sources: ['ES3-ScriptBash.pdf'],
  summary: 'Scripting languages, shells, shebang, кавычки, переменные и built-in variables, read, if/test, [[ ]], case, for/while/until, let и арифметика, массивы, строки, разбор скриптов и упражнения 1–6.',
  sections: [
    {
      id: 'scripting',
      h: 'Scripting languages и их 6 характеристик',
      html: `
<ul>
  <li>Scripting languages делают упор на <b>flexibility, rapid development</b> и <b>dynamic checking</b>.</li>
  <li><b>Scripts</b> — код для <b>автоматизации</b> процессов, которые иначе пришлось бы выполнять шаг за шагом.</li>
  <li>Их type systems оперируют высокоуровневыми понятиями: <b>tables, patterns, lists, files</b>.</li>
  <li>Это языки на основе <b>interpreter</b> (трансляция и выполнение кода интерпретатором).</li>
</ul>
<table class="t">
  <tr><th>Два типа «предков»</th><th>Примеры</th></tr>
  <tr><td>Выполнение terminal commands в <b>batch mode</b></td><td>bash scripts, <code>.bat</code>-файлы MS-DOS</td></tr>
  <tr><td><b>Text-processing</b> и report generation</td><td>sed, awk → из них вырос <b>Perl</b></td></tr>
</table>
<ul>
  <li><b>«Glue» languages</b> — <b>Perl</b> и <b>Python</b>: созданы, чтобы «склеивать» существующие программы.</li>
  <li>Расширяемые языки для WWW: <b>JavaScript, PHP</b>. Другие general purpose: Tcl, Ruby, VBScript, AppleScript.</li>
</ul>
<table class="t">
  <tr><th>#</th><th>Common characteristic</th><th>Суть</th></tr>
  <tr><td>1</td><td><b>Interpreted for both Batch and Interactive use</b></td><td>Perl — JIT compiler («compreter» = compilatore + interprete), читает всю программу до выполнения; другие выполняют строку сразу после чтения; Python, Tcl, Ruby принимают команды с клавиатуры</td></tr>
  <tr><td>2</td><td><b>Economy of Expression</b></td><td>минимум boilerplate: <code>public static void main(String args[]) { System.out.println("Hello!"); }</code> vs <code>echo "Hello!"</code></td></tr>
  <tr><td>3</td><td><b>Lack of declarations; simple scoping rules</b></td><td>объявлений нет; Perl — всё <b>global</b> по умолчанию; Tcl и PHP — всё <b>local</b>; Python — переменная local для блока, где ей присвоено значение</td></tr>
  <tr><td>4</td><td><b>Flexible dynamic typing</b></td><td>PHP, Ruby, Python — тип проверяется непосредственно перед использованием; Tcl, Perl — переменная интерпретируется по-разному в разных контекстах</td></tr>
  <tr><td>5</td><td><b>Easy access to other programs</b></td><td>команды ОС и их output доступны напрямую (в отличие от громоздкого <code>Runtime.exec</code> в Java); Perl — 100 built-in команд ОС, в Python — модуль <code>os</code></td></tr>
  <tr><td>6</td><td><b>Sophisticated Pattern matching</b></td><td>наследие text processing: поиск, работа со строками на основе <b>extended regular expressions</b>; <b>sed</b> — мощный язык обработки текста</td></tr>
</table>
<p>Пример dynamic typing в Perl (контекст определяет тип):</p>
<pre class="code" data-lang="text">$a = "4";
print $a . 3 . "\\n";    # 43 : "." — конкатенация, $a как строка
print $a + 4 . "\\n";    # 8  : "+" — сложение, $a как число</pre>
<div class="callout note">Вопрос со слайда: что делает <code>sed '1!G;h;$!d'</code>? — печатает строки файла в <b>обратном порядке</b>: вход <code>1 2 3</code> (по строке) → <code>3 2 1</code>.</div>`,
      exam: 'Перечислить 6 характеристик; glue languages (Perl, Python); два типа предков (batch / text-processing).'
    },
    {
      id: 'shell',
      h: 'Shell и UNIX shells',
      html: `
<ul>
  <li><b>Shell</b> — просто ещё одна программа поверх kernel, дающая базовый интерфейс human–OS.
    <ul>
      <li>это <b>command interpreter</b>, построенный поверх kernel;</li>
      <li>позволяет пользователям запускать сервисы UNIX OS;</li>
      <li>в простейшем виде последовательность команд в файле — уже <b>shell program</b>, избавляющая от повторного набора.</li>
    </ul>
  </li>
</ul>
<table class="t">
  <tr><th>Shell</th><th>Описание</th></tr>
  <tr><td><code>sh</code></td><td><b>Bourne Shell</b> — original shell (Steven Bourne, AT&amp;T)</td></tr>
  <tr><td><code>csh</code></td><td><b>C-Shell</b> — C-like syntax (Bill Joy, Univ. of California)</td></tr>
  <tr><td><code>bash</code></td><td><b>Bourne Again Shell</b> — GNU improved Bourne Shell</td></tr>
  <tr><td><code>ksh</code></td><td><b>Korn-Shell</b> — Bourne + some C-shell (David Korn, AT&amp;T)</td></tr>
  <tr><td><code>tcsh</code></td><td><b>Turbo C-Shell</b> — more user friendly C-Shell</td></tr>
  <tr><td><code>zsh</code></td><td>extension of bash (Paul Falstad, 1990)</td></tr>
</table>
<pre class="code" data-lang="bash">$ echo $SHELL      # default shell (SHELL — pre-defined variable)
$ cat /etc/shells  # доступные shells
$ exec bash        # переключиться на shell (или просто набрать: bash)
$ exit             # вернуться в предыдущий shell</pre>`,
      viz: [{ name: 'layers', caption: 'Shell — оболочка вокруг OS, через неё работают users', props: { layers: [
        { label: 'users', tone: 'muted' },
        { label: 'Shell', sub: 'command interpreter', tone: 'acc' },
        { label: 'OS (kernel)', tone: 'warn' }] } }]
    },
    {
      id: 'script',
      h: 'Shell script, shebang, комментарии',
      html: `
<ul>
  <li><b>Shell script</b> — script, написанный для shell. Два ингредиента: <b>UNIX/Linux commands</b> + <b>shell programming syntax</b>.</li>
  <li>Это текстовые файлы с последовательностями команд, созданные текстовым редактором.</li>
  <li><b>Компилятор не нужен</b>: shell работает как interpreter, читая script.</li>
  <li>Чтобы ОС считала файл программой, нужно сделать его исполняемым: <code>chmod +x test.sh</code>.</li>
  <li>Shell programs работают <b>медленнее</b> compiled programs: shell интерпретирует каждую команду перед выполнением.</li>
</ul>
<div class="callout key"><b>Header</b> — первая строка, <b>she-bang</b> (sha-bang) + interpreter: <code>#!/bin/bash</code>. Сообщает ОС, что дальше script, а не обычный текст, и какой interpreter его выполняет.</div>
<p><b>How scripts work</b>: каждая команда script выполняется interpreter из shebang:</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash --
echo "Hello"
ls -al</pre>
<pre class="code" data-lang="text">/bin/bash echo "Hello"
/bin/bash ls -al</pre>
</div>
<pre class="code" data-lang="bash">$ chmod +x test.sh
$ ./test.sh</pre>
<p><b>Commenting</b>:</p>
<ul>
  <li>строки, начинающиеся с <code>#</code>, — комментарии, <b>кроме первой</b>, где <code>#!</code> указывает shell для выполнения script;</li>
  <li>на любой строке символы после <b>unquoted</b> <code>#</code> игнорируются;</li>
  <li>зачем: кто и когда написал, input variables, читаемость, пояснение сложных мест, version control, история изменений.</li>
</ul>`,
      exam: 'Смысл #!/bin/bash; зачем chmod +x; почему scripts медленнее compiled programs; # как комментарий.'
    },
    {
      id: 'examples',
      h: 'Examples 1–3: hello, list_files, backup',
      html: `
<p><b>Example 1</b> — <code>hello.sh</code>: создать папку <code>hello</code> и в ней файл <code>hello.txt</code> с текстом «hello guys!».</p>
<pre class="code" data-lang="bash">#!/bin/bash --
mkdir hello
echo "hello guys!" &gt; hello/hello.txt</pre>
<p><b>Example 2</b> — <code>list_files.sh</code>: создать папку <code>my_files</code>, в ней три пустых файла file1.txt, file2.txt, file3.txt, вывести список.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Creating the my_files folder
mkdir my_files
# Creating three empty files
touch my_files/file1.txt
touch my_files/file2.txt
touch my_files/file3.txt
# List of files within the folder
ls my_files</pre>
<p><b>Example 3</b> — <code>backup.sh</code>: создать <code>backup_folder</code>, файл <code>data.txt</code> с текстом «Important data» в текущей папке, скопировать его в backup_folder с именем <code>data_backup.txt</code>.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Creating the Backup Folder
mkdir backup_folder
# Creating the data.txt file with text
echo "Important data" &gt; data.txt
# Copy the data.txt file to the backup_folder folder and rename
cp data.txt backup_folder/data_backup.txt</pre>
<div class="callout note"><code>touch</code> создаёт пустой файл; <code>echo "текст" &gt; file</code> создаёт файл с текстом; <code>cp</code> с новым именем копирует и переименовывает одновременно.</div>`
    },
    {
      id: 'quotes',
      h: 'Quote characters: \' " и backquote',
      html: `
<table class="t">
  <tr><th>Символ</th><th>Название</th><th>Поведение</th></tr>
  <tr><td><code>'</code></td><td>single quote, <b>strong quote</b></td><td>всё внутри берётся <b>буквально</b>, ничего не считается специальным</td></tr>
  <tr><td><code>"</code></td><td>double quote, <b>weak quote</b></td><td>ссылки на переменные (<code>$variable</code>) заменяются значениями; backquote и escape <code>&#92;</code> тоже обрабатываются</td></tr>
  <tr><td><code>&#96;</code></td><td><b>back quote</b> (backtick)</td><td>строка внутри выполняется <b>как команда</b>; при успехе её output подставляется на место строки</td></tr>
</table>
<pre class="code" data-lang="bash">$ echo 'Today is:' &#96;date&#96;
Today is: Wed Nov 4 16:49:43 2026</pre>
<div class="callout note">Если backquote нет на клавиатуре: Mac — <code>option+&#92;</code>, Windows — <code>ALT+96</code>, Linux — <code>ALTGR+'</code>.</div>`,
      exam: 'Что выведет echo с переменной в одинарных / двойных кавычках; backquote = подстановка output команды.'
    },
    {
      id: 'variables',
      h: 'Variables и environment variables',
      html: `
<pre class="code" data-lang="bash">#!/bin/bash
location=World
echo "Hello &#36;{location}"

cmd_to_run=echo
&#36;{cmd_to_run} "Hello World"</pre>
<ul>
  <li>Присваивание — <code>name=value</code> (без пробелов вокруг <code>=</code>), чтение — <code>$name</code>.</li>
  <li><code>$foobar</code> интерпретируется как <code>&#36;{foobar}</code>. Фигурные скобки нужны, если сразу за именем идут символы, допустимые в имени: <code>&#36;{VAR1}World</code>.</li>
  <li>Значение переменной может быть даже именем команды: <code>&#36;{cmd_to_run} "Hello World"</code> выполняет <code>echo</code>.</li>
</ul>
<p><b>Variables</b> — символические имена значений в памяти. Три типа:</p>
<table class="t">
  <tr><th>Тип</th><th>Описание</th></tr>
  <tr><td><b>Global (Environment)</b></td><td>глобальные системные переменные, <b>capitalized</b>: <code>HOME</code>, <code>PATH</code>, <code>SHELL</code>, <code>USERNAME</code>, <code>PWD</code>. Определены при login, их можно свободно использовать в scripts</td></tr>
  <tr><td><b>Local</b></td><td>создаются в script сколько угодно; существуют только внутри этого shell</td></tr>
  <tr><td><b>Special</b></td><td>зарезервированы для ОС/shell: positional parameters <code>$0</code>, <code>$1</code>, …</td></tr>
</table>
<table class="t">
  <tr><th>Environment variable</th><th>Значение</th></tr>
  <tr><td><code>USER</code></td><td>текущий залогиненный пользователь</td></tr>
  <tr><td><code>HOME</code></td><td>home directory текущего пользователя</td></tr>
  <tr><td><code>EDITOR</code></td><td>редактор по умолчанию (команда <code>edit</code>)</td></tr>
  <tr><td><code>SHELL</code></td><td>путь к shell пользователя (bash, zsh)</td></tr>
  <tr><td><code>LOGNAME</code></td><td>имя текущего пользователя</td></tr>
  <tr><td><code>PATH</code></td><td>список каталогов для поиска команд — просматриваются по порядку, берётся первый найденный executable</td></tr>
  <tr><td><code>LANG</code></td><td>текущие locale settings</td></tr>
</table>`,
      exam: 'Зачем фигурные скобки ${var}; три типа переменных; что хранит PATH.'
    },
    {
      id: 'arith',
      h: 'Арифметика: $(( )), let, expr — Example 4',
      html: `
<p><b>Example 4</b> — <code>math_operations.sh</code>: переменные a и b, их сумма и произведение. TIPS: синтаксис операций <code>$((var1 op var2))</code>.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Defining variables
a=5
b=3
# Sum and product
sum=$((a + b))
product=$((a * b))
# Printing Results
echo "Sum of a and b is: $sum"
echo "Product of a and b is: $product"</pre>
<pre class="code" data-lang="text">Sum of a and b is: 8
Product of a and b is: 15</pre>
<p><b>Operations on variables</b> (три равносильных способа уменьшить x на 1):</p>
<pre class="code" data-lang="bash">let "x=x-1"    # decrease x by 1
let "x-=1"     # decrease x by 1
x=$(($x-1))    # decrease x by 1
# +=  increment variable
# -=  decrement variable
# *=  multiply variable
# /=  divide variable</pre>
<ul>
  <li><code>let</code> вычисляет арифметическое выражение; внутри <code>let "…"</code> и <code>$(( ))</code> переменные можно писать без <code>$</code>.</li>
  <li>Арифметика bash — <b>целочисленная</b>: <code>$((7 / 2))</code> = 3, <code>%</code> — остаток.</li>
  <li><code>expr</code> (используется в Exercise 4): <code>sd=&#96;expr $n % 10&#96;</code>; умножение экранируется: <code>expr $rev &#92;* 10 + $sd</code> (иначе <code>*</code> раскроется как wildcard). Пробелы вокруг операторов обязательны.</li>
</ul>
<div class="callout warn">Без <code>let</code>/<code>$(( ))</code> операторы <code>+=</code> и <code>+</code> работают со <b>строками</b>: <code>n=5; n+=1</code> даёт <code>51</code>, а <code>i=$i+1</code> даёт строку <code>0+1</code>.</div>`,
      exam: 'Вычислить $(( )) с целочисленным делением; последовательность let "x-=1", let "x*=2"…'
    },
    {
      id: 'builtin',
      h: 'Built-in variables: $0, $1…, $#, $@, $*, $?, $$',
      html: `
<p>Переменные-числа — <b>аргументы script</b> (positional parameters):</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
echo "Benvenuti $1 e $2!"</pre>
<pre class="code" data-lang="text">$ ./welcome.sh Pippo Pluto
Benvenuti Pippo e Pluto!</pre>
</div>
<p><code>./script.sh Hello World</code> даёт: <code>$0 = ./script.sh</code>, <code>$1 = Hello</code>, <code>$2 = World</code>. Число positional parameters — в <code>$#</code>.</p>
<p>Built-in variables можно <b>только читать</b>, присваивать им нельзя:</p>
<table class="t">
  <tr><th>Переменная</th><th>Значение</th></tr>
  <tr><td><code>$*</code></td><td>positional parameters начиная с первого; внутри <code>"…"</code> — <b>одно слово</b>, параметры через первый символ IFS (пробел)</td></tr>
  <tr><td><code>$@</code></td><td>positional parameters начиная с первого; внутри <code>"…"</code> — <b>каждый параметр отдельным словом</b></td></tr>
  <tr><td><code>$#</code></td><td>число positional parameters (decimal)</td></tr>
  <tr><td><code>$?</code></td><td>exit status последнего выполненного foreground pipeline (0 = успех)</td></tr>
  <tr><td><code>$-</code></td><td>текущие option flags (заданные при запуске, через <code>set</code> или самим shell, например <code>-i</code>)</td></tr>
  <tr><td><code>$$</code></td><td>process ID текущего shell</td></tr>
  <tr><td><code>$!</code></td><td>process ID последней команды, запущенной в background</td></tr>
  <tr><td><code>$0</code></td><td>имя текущего shell или shell script</td></tr>
</table>
<p><b>shift</b> сдвигает параметры: <code>$2</code> становится <code>$1</code> и т. д., <code>$#</code> уменьшается на 1.</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
echo "Benvenuto $1!"
shift
echo "Benvenuti anche a voi $@!"</pre>
<pre class="code" data-lang="text">$ ./welcome.sh Pippo Pluto Topolino
Benvenuto Pippo!
Benvenuti anche a voi Pluto Topolino!</pre>
</div>
<p>Типичный цикл по всем аргументам — <code>while</code> + <code>shift</code>:</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'stepper', caption: 'Трассировка: ./args.sh a b c', props: { lang: 'bash', code: "while [ $# -gt 0 ]\ndo\necho $1\nshift\ndone", steps: [
        { line: 1, note: 'Три аргумента: $# = 3 > 0 → входим в цикл', vars: { '$#': 3, '$1': 'a', '$2': 'b', '$3': 'c' } },
        { line: 3, note: 'Печатаем первый аргумент', vars: { '$#': 3, '$1': 'a' }, out: 'a' },
        { line: 4, note: 'shift: b становится $1, c — $2', vars: { '$#': 2, '$1': 'b', '$2': 'c' } },
        { line: 1, note: '$# = 2 > 0 → продолжаем', vars: { '$#': 2, '$1': 'b' } },
        { line: 3, vars: { '$#': 2, '$1': 'b' }, note: 'Печатаем b', out: 'b' },
        { line: 4, note: 'shift', vars: { '$#': 1, '$1': 'c' } },
        { line: [1, 3], note: '$# = 1 > 0 → печатаем c', vars: { '$#': 1, '$1': 'c' }, out: 'c' },
        { line: 4, note: 'shift: аргументов не осталось', vars: { '$#': 0, '$1': '' } },
        { line: [1, 5], note: '$# = 0 → условие ложно, выход из цикла', vars: { '$#': 0 } }] } }],
      exam: '$# считает аргументы (кавычки объединяют слова); $0 — имя script; разница "$*" и "$@"; эффект shift.'
    },
    {
      id: 'read',
      h: 'Input: read — Example 5 (calculator)',
      html: `
<p>Built-in <b><code>read</code></b> читает строку со standard input в переменную:</p>
<pre class="code" data-lang="bash">echo Come ti chiami?
read NOME
echo "Ciao $NOME - tutto ok?"</pre>
<p><b>Example 5</b> — <code>calculator.sh</code>: принять два числа, вывести сумму, разность и произведение.</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Give me the first number:"
read num1
echo "Give me the second number:"
read num2
# results
echo "Sum: $((num1 + num2))"
echo "Diff: $((num1 - num2))"
echo "Product: $((num1 * num2))"</pre>
<pre class="code" data-lang="text">Give me the first number:
3
Give me the second number:
7
Sum: 10
Diff: -4
Product: 21</pre>`
    },
    {
      id: 'if',
      h: 'if, test, операторы сравнения, $?',
      html: `
<p><b>Control structures</b> bash: <code>if-then-else</code>, <code>case</code>, loops: <code>for</code>, <code>while</code>, <code>until</code>, <code>select</code>.</p>
<pre class="code" data-lang="bash">if command
then
  statements
fi</pre>
<div class="callout key">statements выполняются, только если command <b>succeeds</b>, т. е. вернула <b>return status 0</b>.</div>
<p><b>test command</b>: <code>test expression</code> или <code>[ expression ]</code> — вычисляет expression и возвращает true/false. <b>Пробел после <code>[</code> и перед <code>]</code> обязателен!</b></p>
<pre class="code" data-lang="bash">if test 5 -eq 7
then
  echo "same"
fi

if [ 5 -eq 7 ]
then
  echo "same"
fi</pre>
<div class="cols">
<table class="t">
  <tr><th>Integer comparison</th><th>Function</th></tr>
  <tr><td><code>-gt</code></td><td>greater than</td></tr>
  <tr><td><code>-lt</code></td><td>less than</td></tr>
  <tr><td><code>-ge</code></td><td>greater than or equal to</td></tr>
  <tr><td><code>-le</code></td><td>less than or equal to</td></tr>
  <tr><td><code>-eq</code></td><td>equal to</td></tr>
  <tr><td><code>-ne</code></td><td>not equal to</td></tr>
</table>
<table class="t">
  <tr><th>String comparison</th><th>Function</th></tr>
  <tr><td><code>-z</code></td><td>test for empty string</td></tr>
  <tr><td><code>=</code></td><td>equality of strings</td></tr>
  <tr><td><code>!=</code></td><td>inequality of strings</td></tr>
  <tr><th>Logical</th><th>Function</th></tr>
  <tr><td><code>-a</code></td><td>logical AND</td></tr>
  <tr><td><code>-o</code></td><td>logical OR</td></tr>
  <tr><td><code>!</code></td><td>logical NOT</td></tr>
</table>
</div>
<p>Результат <code>test</code> / <code>[ ]</code> сохраняется в built-in variable <b><code>$?</code></b> (0 — true, 1 — false). Следи за пробелами:</p>
<pre class="code" data-lang="bash">#!/bin/bash
i="abc"
j="def"
[ $j != $i ]
echo $?
# output: 0   ("def" != "abc" — истина)</pre>
<p><b>if-then-else</b> и <b>elif</b> («else if»; часть if, отдельно не используется):</p>
<div class="cols">
<pre class="code" data-lang="bash">if [ condition ];
then
  statements-1
else
  statements-2
fi</pre>
<pre class="code" data-lang="bash">if [ condition ]; then
  statements
elif [ condition ]; then
  statement
else
  statements
fi</pre>
</div>
<p><b>Exercise</b> <code>simple_if.sh</code>: если n &lt; 10 — «It is a one digit number», иначе «It is a two digit number».</p>
<pre class="code" data-lang="bash">#!/bin/bash
n=10
if [ $n -lt 10 ]
then
echo "It is a one digit number"
else
echo "It is a two digit number"
fi
# output: It is a two digit number   (10 -lt 10 — ложь)</pre>
<div class="callout warn"><code>if [$n -lt 10]</code> без пробелов: shell ищет команду <code>[5</code> → <code>command not found</code> (status 127) → выполняется ветка <code>else</code>.</div>`,
      exam: 'Операторы -eq -ne -gt -lt -ge -le, -z = !=, -a -o !; $? = 0 означает true; пробелы в [ ].'
    },
    {
      id: 'brackets',
      h: '[ vs [[, AND/OR — Example 6',
      html: `
<p><b><code>[[</code></b> — улучшение bash для команды <code>[</code>: меняет то, как shell разбирает код до парной <code>]]</code>.</p>
<ul>
  <li>Не нужно «бешено» заключать переменные в кавычки: <code>[[</code> интуитивно обрабатывает пустые строки и строки с пробелами.</li>
  <li>Можно использовать <code>&amp;&amp;</code> и <code>||</code> для булевых проверок и <code>&lt;</code> / <code>&gt;</code> для <b>сравнения строк</b>.</li>
  <li><code>[[</code> работает в <b>bash</b>, но <b>не в pure sh</b>.</li>
</ul>
<pre class="code" data-lang="bash">if [ -f "$file" ]
if [[ -f $file ]]
if [[ $x &gt; 5 &amp;&amp; $y &lt; 10 ]]; then echo " x is greater than 5 and y is less than 10"; fi</pre>
<div class="callout warn"><code>&gt;</code> / <code>&lt;</code> в <code>[[ ]]</code> сравнивают <b>строки лексикографически</b>: при <code>x=10</code> условие <code>[[ $x &gt; 5 ]]</code> <b>ложно</b> ("1" &lt; "5"). Для чисел — <code>-gt</code>/<code>-lt</code>.</div>
<p><b>AND и OR</b>: <code>&amp;&amp;</code> / <code>||</code> — между командами <code>[ ]</code> или внутри <code>[[ ]]</code>; <code>-a</code> / <code>-o</code> — внутри одной <code>[ ]</code>: <code>[ $n -gt 0 -a $n -le 10 ]</code>.</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Enter username"
read username
echo "Enter password"
read password
if [[ ( $username == "admin" &amp;&amp; $password == "secret" ) ]]; then
echo "valid user"
else
echo "invalid user"
fi</pre>
<p><b>Example 6</b> — <code>number_check.sh</code>: ввести число и логическими операторами определить диапазон (0,10], (10,20], &gt;20.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Prompt the user to enter a number
echo "Enter a number:"
read number
# Check the range using logical operators
if [ $number -gt 0 ] &amp;&amp; [ $number -le 10 ]; then
echo "The number is between 1 and 10"
elif [ $number -gt 10 ] &amp;&amp; [ $number -le 20 ]; then
echo "The number is between 11 and 20"
elif [ $number -gt 20 ]; then
echo "The number is greater than 20"
else
echo "The number is 0 or less"
fi</pre>`,
      exam: 'Чем [[ ]] отличается от [ ] (кавычки, && ||, < > для строк, только bash); пройти Example 6 для граничных значений (10, 20, 0).'
    },
    {
      id: 'filetests',
      h: 'Проверка файлов — Example 7 и Exercise 1',
      html: `
<p><b>test</b> умеет анализировать файлы:</p>
<pre class="code" data-lang="bash">if test -w "$1"
then
  echo "file $1 is write-able"
fi</pre>
<table class="t">
  <tr><th>Оператор</th><th>Истина, если путь…</th></tr>
  <tr><td><code>-e</code></td><td>существует</td></tr>
  <tr><td><code>-f</code></td><td>существует и это обычный <b>файл</b></td></tr>
  <tr><td><code>-d</code></td><td>существует и это <b>каталог</b></td></tr>
  <tr><td><code>-r</code> / <code>-w</code> / <code>-x</code></td><td>доступен на read / write / execute</td></tr>
  <tr><td><code>-s</code></td><td>существует и имеет ненулевой размер</td></tr>
</table>
<p><b>Example 7</b>: script принимает один аргумент (path) и сообщает, файл это, каталог или ни то ни другое. TIPS: <code>$#</code> — проверка числа аргументов.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Check if exactly one argument was provided
if test "$#" -ne 1; then
  echo "Error in the number of parameters"
   exit 1
fi
# Check if the argument is a file, directory or neither
if test -f "$1"; then
  echo " $1 is a file."
elif test -d "$1"; then
  echo "$1 is a directory."
else
  echo "$1 is neither a file nor a directory."
fi</pre>
<p><b>Exercise 1</b>: script получает строку; если это <b>файл</b> — вывести его первые 10 строк; если <b>каталог</b> — число файлов/каталогов в нём. Подсказки: <code>head -n 10 &lt;nomefile&gt;</code>, <code>ls &lt;nomedir&gt; | wc -l</code>.</p>
<pre class="code" data-lang="bash">#!/bin/bash

if test $# -ne 1
	then echo "parametri non corretti"

elif test -d "$1"
	then echo $1
	ls $1 |wc -l
elif test -f "$1"
	then head -c 10 $1
fi</pre>
<div class="callout warn">В решении на слайде для файла стоит <code>head -c 10</code> — это первые <b>10 символов (байт)</b>, а не строк. По заданию нужно <code>head -n 10 $1</code>.</div>`,
      exam: '-f / -d / -w / -e; проверка $# -ne 1 + exit 1; найти ошибку head -c vs head -n.'
    },
    {
      id: 'case',
      h: 'case и shell expansions — Example 8',
      html: `
<ul>
  <li><b>case</b> выполняет statements по конкретному значению; удобен вместо if при большом числе условий.</li>
  <li>Значение может быть выражением; каждый набор statements заканчивается <code>;;</code>; <code>*)</code> ловит всё, что не совпало с остальными.</li>
</ul>
<pre class="code" data-lang="bash">case $var in
val1)
  statements;;
val2)
  statements;;
*)
  statements;;
esac</pre>
<pre class="code" data-lang="bash">#!/bin/bash
echo -n "Enter a number 1 &lt; x &lt; 10: "
read x
case $x in
1) echo "Value of x is 1.";;
2) echo "Value of x is 2.";;
3) echo "Value of x is 3.";;
4) echo "Value of x is 4.";;
5) echo "Value of x is 5.";;
6) echo "Value of x is 6.";;
7) echo "Value of x is 7.";;
8) echo "Value of x is 8.";;
9) echo "Value of x is 9.";;
0 | 10) echo "wrong number.";;
*) echo "Unrecognized value.";;
esac</pre>
<p><b>Shell Expansions</b>: shell раскрывает имена файлов с «jolly characters» <code>*</code>, <code>?</code>, <code>[..]</code> в список подходящих имён: в <code>ls -al *.sh</code> шаблон <code>*.sh</code> заменяется списком файлов с расширением .sh. Это особый вид regular expressions, зависящий от контекста. В case те же шаблоны:</p>
<pre class="code" data-lang="bash">case $1 in
aa|ab) echo A ;;
b?)      echo B ;;
c*)      echo C ;;
*)       echo D ;;
esac</pre>
<table class="t">
  <tr><th>Шаблон</th><th>Смысл</th><th>$1 → вывод</th></tr>
  <tr><td><code>aa|ab</code></td><td><code>|</code> — альтернатива</td><td>ab → A</td></tr>
  <tr><td><code>b?</code></td><td><code>?</code> — ровно один любой символ</td><td>bc → B, но b и bcd → D</td></tr>
  <tr><td><code>c*</code></td><td><code>*</code> — любая строка (в т. ч. пустая)</td><td>c, cat → C</td></tr>
  <tr><td><code>*</code></td><td>всё остальное</td><td>xyz → D</td></tr>
</table>
<p><b>Example 8</b>: по имени файла (один аргумент) через case определить, начинается ли оно с <b>строчной</b> «a».</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Check if exactly one argument was provided
if test "$#" -ne 1; then
  echo "Error: Please provide a single filename as an argument."
  exit 1
fi
# Use the case structure to check if $1 starts with "a" in lowercase
case "$1" in
  a*)
    echo "The filename starts with 'a'."
    ;;
  *)
    echo "The filename does not start with 'a'."
    ;;
esac</pre>`,
      exam: 'Какая ветка case сработает для данного аргумента (?, *, |); ;; и esac; case чувствителен к регистру.'
    },
    {
      id: 'for',
      h: 'for: list, *, C-style — Exercises 2 и 3',
      html: `
<pre class="code" data-lang="bash">for var in list
do
  statements
done</pre>
<p>statements выполняются для <code>var</code>, равной каждому значению из <code>list</code>.</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
let sum=0
for num in 1 2 3 4 5
do
let "sum = $sum + $num"
done
echo $sum
# output: 15</pre>
<pre class="code" data-lang="bash">#!/bin/bash
lista="antonio
michele
paolo
luca"
for x in $lista
do
echo "The value of variable x is: $x"
sleep 1
done
# The value of variable x is: antonio
# The value of variable x is: michele
# The value of variable x is: paolo
# The value of variable x is: luca</pre>
</div>
<pre class="code" data-lang="bash">#!/bin/bash
for x in *
do
ls -l "$x"
sleep 1
done
# Lists all files in current directory

#!/bin/bash
for x in /bin
do
ls -l "$x"
done
# Lists all files in /bin</pre>
<div class="callout note"><code>for x in *</code> — по одному имени файла текущего каталога за итерацию. <code>for x in /bin</code> — список из <b>одного</b> элемента: одна итерация, а файлы /bin выводит сам <code>ls -l "/bin"</code>.</div>
<p><b>C-style for</b> (используется в «Analyzing scripts»): <code>for ((nr=1; nr&lt;$MAX; nr++))</code> — init; condition; step.</p>
<p><b>Exercise 2</b>: новая команда <code>&lt;new_command&gt; &lt;dir&gt;</code>: просканировать каталог; для каждого файла — имя и первые 10 строк, для каждого каталога — имя и число элементов.</p>
<pre class="code" data-lang="bash">#!/bin/bash
if  [ $# -ne 1 ]; then
	echo "you did not specify the directory"
	exit
fi

if ! test -d $1; then
	echo "$1 is not a valid directory"
	exit
fi

cd $1

for i in *
do
	if test -d "$i"; then
		echo "$i:" &#96;ls $i |wc -l&#96; "elements"
	elif test -f "$i"; then
		echo "$i:" &#96;head -n 10 $i&#96;
	fi
done</pre>
<div class="callout note">Command substitution без кавычек (<code>&#96;head -n 10 $i&#96;</code>) склеивает строки через пробел: вывод файла печатается в одну строку.</div>
<p><b>Exercise 3</b>: <code>&lt;new_command&gt; &lt;dir&gt; &lt;filter&gt;</code> — как Exercise 2, но исключить файлы/каталоги со строкой filter.</p>
<pre class="code" data-lang="bash">#!/bin/bash

if ! test -d $1; then
	echo "$1 is not a valid directory"
	exit
fi

cd $1

for i in *
do

	case $i in

		$2*)
		;;

		*)
			if test -d "$i"; then
				echo "$i:" &#96;ls $i |wc -l&#96; "elements"
			elif test -f "$i"; then
				echo "$i:" &#96;head -n 10 $i&#96;
			fi
		;;
	esac
done</pre>
<div class="callout warn">Шаблон <code>$2*)</code> исключает только имена, которые <b>начинаются</b> с filter (для «содержит» нужен <code>*$2*)</code>). Пустая ветка <code>;;</code> — «ничего не делать».</div>`,
      exam: 'Сколько итераций сделает for для данного list; C-style for; разобрать Exercise 2/3.'
    },
    {
      id: 'while',
      h: 'while, until — Exercise 4 (reverse number)',
      html: `
<p><b>while</b> выполняет команды, пока условие истинно; завершается, как только условие стало ложным. Если условие никогда не станет ложным — бесконечный цикл.</p>
<pre class="code" data-lang="bash">while expression
do
  statements
done</pre>
<pre class="code" data-lang="bash">#!/bin/bash
echo -n  "Enter a number: "; read x
sum=0
i=0
while [[ $i -le $x ]]; do
     let "sum = sum + i"
        i=$i+1
    done
echo "the sum of the first $x numbers is: $sum"</pre>
<div class="callout warn"><code>i=$i+1</code> присваивает <b>строку</b> («0+1», «0+1+1», …). Скрипт всё равно работает: в <code>[[ … -le … ]]</code> и <code>let</code> операнды вычисляются как арифметические выражения. Для ввода 4 печатает 10.</div>
<p><b>while + shift</b> — перебор всех аргументов (<code>shift</code>: перейти к следующему параметру):</p>
<pre class="code" data-lang="bash">while [ $# -gt 0 ]
do
echo $1
shift
done</pre>
<p><b>Exercise 4</b>: вывести число в обратном порядке; input из командной строки, без input — сообщение об ошибке (<code>./reverse.sh 134</code> → <code>Reverse number is 431</code>).</p>
<ol>
  <li>Входное число n; rev = 0, sd = 0 (single digit).</li>
  <li><code>n % 10</code> — крайняя правая цифра → sd.</li>
  <li><code>rev = rev * 10 + sd</code>.</li>
  <li><code>n = n / 10</code> — убрать правую цифру.</li>
  <li>Если n &gt; 0 — повторить с шага 2, иначе напечатать результат.</li>
</ol>
<pre class="code" data-lang="bash">if [ $# -ne 1 ]
then
  echo "Please provide a number as input in the script"
  exit 1
fi
n=$1
rev=0
sd=0
while [ $n -gt 0 ]
  do
  sd=&#96;expr $n % 10&#96;
  echo $sd
  rev=&#96;expr $rev \\* 10  + $sd&#96;
  n=&#96;expr $n / 10&#96;
done
echo  "Reverse number is $rev"</pre>
<div data-viz="0"></div>
<p><b>until</b> — как while, но цикл идёт, <b>пока условие ложно</b> («until this condition is true, do this»):</p>
<pre class="code" data-lang="bash">until [expression]
do
  statements
done</pre>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Enter a number: "; read x
echo ; echo Count Down
until test $x -le 0; do
  echo $x
  let "x=x-1"
  sleep 1
done
echo ; echo GO !</pre>`,
      viz: [{ name: 'stepper', caption: 'Exercise 4: ./reverse.sh 134', props: { lang: 'bash', code: "if [ $# -ne 1 ]\nthen\n  echo \"Please provide a number as input in the script\"\n  exit 1\nfi\nn=$1\nrev=0\nsd=0\nwhile [ $n -gt 0 ]\n  do\n  sd=`expr $n % 10`\n  echo $sd\n  rev=`expr $rev \\* 10  + $sd`\n  n=`expr $n / 10`\ndone\necho  \"Reverse number is $rev\"", steps: [
        { line: 1, note: '$# = 1 → условие ложно, ошибки нет', vars: { '$#': 1, '$1': 134 } },
        { line: [6, 7, 8], note: 'Инициализация', vars: { n: 134, rev: 0, sd: 0 } },
        { line: 9, note: '134 -gt 0 → входим в цикл', vars: { n: 134, rev: 0, sd: 0 } },
        { line: [11, 12], note: 'sd = 134 % 10 = 4', vars: { n: 134, rev: 0, sd: 4 }, out: '4' },
        { line: [13, 14], note: 'rev = 0*10 + 4 = 4; n = 134/10 = 13', vars: { n: 13, rev: 4, sd: 4 } },
        { line: [9, 11, 12], note: '13 > 0; sd = 3', vars: { n: 13, rev: 4, sd: 3 }, out: '3' },
        { line: [13, 14], note: 'rev = 4*10 + 3 = 43; n = 1', vars: { n: 1, rev: 43, sd: 3 } },
        { line: [9, 11, 12], note: '1 > 0; sd = 1', vars: { n: 1, rev: 43, sd: 1 }, out: '1' },
        { line: [13, 14], note: 'rev = 43*10 + 1 = 431; n = 0', vars: { n: 0, rev: 431, sd: 1 } },
        { line: 9, note: '0 -gt 0 ложно → выход из цикла', vars: { n: 0, rev: 431 } },
        { line: 16, note: 'Результат', vars: { rev: 431 }, out: 'Reverse number is 431' }] } }],
      exam: 'Трассировка while (reverse number, сумма); while + shift; сколько раз выполнится until.'
    },
    {
      id: 'arrays',
      h: 'Arrays — Exercise 5 (shortest string)',
      html: `
<pre class="code" data-lang="bash">pet[0]=dog
pet[1]=cat
pet[2]=fish
pet[4]=apple
# or
pet=( dog cat fish apple )

$ echo &#36;{pet[0]}
dog
$ echo &#36;{pet[2]}
fish

echo &#36;{arrayname[*]}        # all elements
for x in &#36;{arrayname[*]}
do
echo $x
done
echo &#36;{#arrayname[*]}       # number of elements</pre>
<ul>
  <li>Создание: по индексам <code>pet[0]=dog</code> или списком <code>pet=( dog cat fish apple )</code>; до 1024 элементов.</li>
  <li><code>&#36;{arr[i]}</code> — элемент, <code>&#36;{arr[*]}</code> (или <code>&#36;{arr[@]}</code>) — все элементы, <code>&#36;{#arr[*]}</code> — <b>число элементов</b>.</li>
  <li><code>&#36;{#var}</code> — <b>длина строки</b>; <code>&#36;{#arr[0]}</code> — длина элемента 0.</li>
</ul>
<div class="callout warn">Индексы могут идти с пропуском: после <code>pet[0..2]</code> и <code>pet[4]</code> элементов <b>4</b> (а не 5); <code>&#36;{pet[3]}</code> пуст.</div>
<p><b>Exercise 5</b>: напечатать самую короткую строку (слово) файла.</p>
<pre class="code" data-lang="bash">echo "Enter the name of the file"
read file
file=( &#96;cat "$file"&#96;)
min=&#36;{#file[0]}
ref=&#36;{file[0]}
for l in &#36;{file[@]}
do
  if test $min -gt &#36;{#l} ; then
    min=&#36;{#l}
    ref=$l
  fi
done
echo "$ref"</pre>
<ul>
  <li><code>file=( &#96;cat "$file"&#96; )</code> — массив из слов файла;</li>
  <li><code>min</code>/<code>ref</code> стартуют с первого слова; слово заменяет минимум только при <b>строго</b> меньшей длине (<code>-gt</code>) — при равенстве остаётся первое найденное.</li>
</ul>`,
      exam: '${#arr[*]} — число элементов (с учётом пропусков), ${#var} — длина строки; разобрать Exercise 5.'
    },
    {
      id: 'strings',
      h: 'Concatenating strings',
      html: `
<pre class="code" data-lang="bash">VAR1="Hello,"
VAR2=" World"
VAR3="$VAR1$VAR2"
echo "$VAR3"            # Hello, World

VAR1="Hello, "
VAR2="&#36;{VAR1}World"
echo "$VAR2"            # Hello, World</pre>
<ul>
  <li>Простейший способ — писать переменные подряд: <code>"$VAR1$VAR2"</code>; можно смешивать с литералами.</li>
  <li>Если за переменной идёт символ, допустимый в имени, имя берётся в фигурные скобки: <code>&#36;{VAR1}World</code> (иначе bash искал бы переменную <code>VAR1World</code>).</li>
  <li>Оператор <code>+=</code> дописывает строку к переменной:</li>
</ul>
<pre class="code" data-lang="bash">VAR1="Hello, "
VAR1+=" World"
echo "$VAR1"            # Hello,  World

VAR=""
for ELEMENT in 'Hydrogen' 'Helium' 'Lithium' 'Beryllium'; do
  VAR+="&#36;{ELEMENT} "
done
echo "$VAR"             # Hydrogen Helium Lithium Beryllium</pre>
<div class="callout note">На слайде вывод первого примера показан как «Hello, World», но <code>"Hello, "</code> + <code>" World"</code> даёт два пробела подряд.</div>`,
      exam: 'Зачем ${VAR}; что делает += со строкой (и с «числом» без let).'
    },
    {
      id: 'analyze',
      h: 'Analyzing scripts: continue и break',
      html: `
<pre class="code" data-lang="bash">MAX=10000
 for((nr=1; nr&lt;$MAX; nr++))
 do
  let "t1 = nr % 5"
  if [ "$t1" -ne 0 ]
  then
   continue
  fi
  let "t2 = nr % 7"
  if [ "$t2" -ne 0 ]
  then
   continue
  fi
  let "t3 = nr % 9"
  if [ "$t3" -ne 0 ]
  then
   continue
  fi
 break  # What happens when you comment out this line? Why?
 done
 echo "Number = $nr"</pre>
<ul>
  <li>Цикл перебирает nr = 1, 2, …; <code>continue</code> пропускает остаток итерации, если nr не делится на 5, на 7 или на 9.</li>
  <li>До <code>break</code> доходит первое число, делящееся на 5, 7 и 9: 5·7·9 = <b>315</b> → <code>Number = 315</code>.</li>
  <li><b>Если закомментировать break</b>: цикл не прерывается, доходит до конца; после выхода nr = MAX → <code>Number = 10000</code>.</li>
</ul>`,
      exam: 'Объяснить результат 315 и что будет без break (10000).'
    },
    {
      id: 'ex6',
      h: 'Exercise 6: проверка надёжности пароля',
      html: `
<p>Пароль сильный, если: длина <b>≥ 8</b>; есть и буквы, и <b>цифры</b>; есть и <b>строчные</b>, и <b>заглавные</b> буквы. Иначе — «Weak Password».</p>
<ul>
  <li><code>grep</code> ищет строки, содержащие совпадение; <code>-q</code> (quiet) — не печатать совпадения, важен только факт совпадения;</li>
  <li><code>$?</code> — return value последней команды: 0 — grep нашёл совпадение.</li>
</ul>
<pre class="code" data-lang="bash">echo "Enter your password"
read password
len="&#36;{#password}"
if test $len -ge 8 ; then
  echo "$password" | grep -q [0-9]
  if test $? -eq 0 ; then
     echo "$password" | grep -q [A-Z]
        if test $? -eq 0 ; then
          echo "$password" | grep -q [a-z]
           if test $? -eq 0 ; then
           echo "Strong Password"
         else
           echo "Weak Password -&gt; Should include a lower case letter."
         fi
      else
       echo "Weak Password -&gt; Should include a capital case letter."
      fi
  else
   echo "Weak Password -&gt; Should use numbers in your password."
  fi
else
  echo "Weak Password -&gt; Password length should have at least 8 characters."
fi</pre>
<table class="t">
  <tr><th>Ввод</th><th>Вывод</th></tr>
  <tr><td>Abc1</td><td>Weak Password -&gt; Password length should have at least 8 characters.</td></tr>
  <tr><td>Password</td><td>Weak Password -&gt; Should use numbers in your password.</td></tr>
  <tr><td>hello123</td><td>Weak Password -&gt; Should include a capital case letter.</td></tr>
  <tr><td>PASSWORD12</td><td>Weak Password -&gt; Should include a lower case letter.</td></tr>
  <tr><td>Passw0rd</td><td>Strong Password</td></tr>
</table>
<div class="callout note">Порядок проверок: длина → цифры → заглавные → строчные; печатается первая проваленная.</div>`
    }
  ],
  terms: [
    { en: 'Scripting language', ru: 'Скриптовый язык', def: 'Интерпретируемый язык для автоматизации: flexibility, rapid development, dynamic checking.' },
    { en: 'Glue language', ru: 'Язык-«клей»', def: 'Язык для склеивания существующих программ (Perl, Python).' },
    { en: 'Shell', ru: 'Командная оболочка', def: 'Command interpreter поверх kernel; интерфейс между пользователем и ОС.' },
    { en: 'bash', ru: 'Bourne Again Shell', def: 'GNU-улучшенный Bourne Shell (sh).' },
    { en: 'Shell script', ru: 'Скрипт shell', def: 'Текстовый файл из UNIX-команд и shell programming syntax; выполняется интерпретатором без компиляции.' },
    { en: 'Shebang (#!)', ru: 'Заголовок скрипта', def: 'Первая строка #!/bin/bash: указывает ОС interpreter для script.' },
    { en: 'Strong quote \'…\'', ru: 'Одинарные кавычки', def: 'Всё внутри буквально, переменные не подставляются.' },
    { en: 'Weak quote "…"', ru: 'Двойные кавычки', def: '$variable, backquote и escape \\ обрабатываются.' },
    { en: 'Backquote (backtick)', ru: 'Обратные кавычки', def: 'Содержимое выполняется как команда, её output подставляется в строку.' },
    { en: 'Environment variable', ru: 'Переменная окружения', def: 'Глобальная системная переменная (HOME, PATH, SHELL, USER…), заглавными буквами.' },
    { en: 'Positional parameters', ru: 'Позиционные параметры', def: '$0 — имя script, $1, $2… — аргументы; их число — $#.' },
    { en: '$?', ru: 'Exit status', def: 'Код возврата последней команды; 0 — успех (true).' },
    { en: '$$ / $!', ru: 'PID', def: '$$ — PID текущего shell; $! — PID последней background-команды.' },
    { en: '"$@" vs "$*"', ru: 'Все аргументы', def: '"$@" — каждый аргумент отдельным словом; "$*" — одно слово из всех аргументов.' },
    { en: 'shift', ru: 'Сдвиг параметров', def: 'Сдвигает positional parameters влево: $2 → $1, $# уменьшается на 1.' },
    { en: 'read', ru: 'Чтение ввода', def: 'Built-in: читает строку из standard input в переменную.' },
    { en: 'test / [ ]', ru: 'Проверка условия', def: 'Вычисляет выражение, результат в $?; пробелы после [ и перед ] обязательны.' },
    { en: '[[ ]]', ru: 'Расширенная проверка', def: 'Улучшение bash: без лишних кавычек, && || внутри, < > для строк; не работает в pure sh.' },
    { en: 'case … esac', ru: 'Множественный выбор', def: 'Выбор ветки по шаблону (*, ?, |); ветки завершаются ;;, *) — по умолчанию.' },
    { en: 'Shell expansion', ru: 'Раскрытие шаблонов', def: 'Замена *, ?, [..] списком подходящих имён файлов.' },
    { en: 'let / $(( ))', ru: 'Арифметика', def: 'Целочисленные вычисления: let "x-=1", sum=$((a + b)).' },
    { en: 'until', ru: 'Цикл «до тех пор»', def: 'Повторяет тело, пока условие ложно.' },
    { en: 'Array', ru: 'Массив', def: 'pet=( dog cat ); ${pet[0]} — элемент, ${pet[*]} — все, ${#pet[*]} — количество.' },
    { en: 'continue / break', ru: 'Управление циклом', def: 'continue — к следующей итерации; break — выход из цикла.' }
  ],
  questions: [
    { id: 'sh-01', type: 'single', q: 'Что НЕ входит в 6 common characteristics of scripting languages?', options: ['Interpreted for both batch and interactive use', 'Economy of expression', 'Обязательные объявления переменных и static typing', 'Sophisticated pattern matching'], answer: 2, explain: 'Наоборот: lack of declarations и flexible dynamic typing. Остальные варианты — из списка шести.', section: 'scripting', diff: 1 },
    { id: 'sh-02', type: 'single', q: 'Какая команда показывает default shell пользователя?', options: ['cat /etc/shells', 'echo $SHELL', 'exec bash', 'echo $0SHELL'], answer: 1, explain: 'SHELL — pre-defined variable с путём к shell. cat /etc/shells — список доступных shells, exec bash — переключение.', section: 'shell', diff: 1 },
    { id: 'sh-03', type: 'single', q: 'Зачем нужна первая строка #!/bin/bash?', options: ['Это комментарий, shell его игнорирует', 'Сообщает ОС, что файл — script, и какой interpreter его выполняет', 'Делает файл исполняемым', 'Подключает библиотеку bash'], answer: 1, explain: 'She-bang + путь к interpreter. Исполняемым файл делает chmod +x; обычные строки с # — комментарии, но не первая с #!.', section: 'script', diff: 1 },
    { id: 'sh-04', type: 'code', lang: 'bash', q: 'Что выведет фрагмент? (строки разделены |)', code: "name=World\necho 'Hello $name'\necho \"Hello $name\"", options: ['Hello World | Hello World', 'Hello $name | Hello World', 'Hello World | Hello $name', 'Hello $name | Hello $name'], answer: 1, explain: 'Single quote — strong quote: всё буквально. Double quote — weak: $name заменяется на World.', section: 'quotes', diff: 1 },
    { id: 'sh-05', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "a=3\necho \"a=$a\" 'a=$a' `echo a`", options: ['a=3 a=3 a', 'a=3 a=$a a', 'a=3 a=$a echo a', 'a=$a a=$a a'], answer: 1, explain: 'В "…" $a подставляется, в \'…\' — нет, а backquote выполняет команду echo a и подставляет её output «a».', section: 'quotes', diff: 2 },
    { id: 'sh-06', type: 'code', lang: 'bash', q: 'Что выведет фрагмент? (строки разделены |)', code: "fruit=apple\necho \"[$fruits]\"\necho \"${fruit}s\"", options: ['[apples] | apples', '[] | apples', '[apple] | apple s', 'Ошибка: переменная fruits не объявлена'], answer: 1, explain: '$fruits — другая, не заданная переменная → пустая строка (ошибки нет). ${fruit}s отделяет имя скобками → apples.', section: 'variables', diff: 2 },
    { id: 'sh-07', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "a=7\nb=2\necho \"$((a + b)) $((a * b)) $((a / b)) $((a % b))\"", options: ['9 14 3.5 1', '9 14 3 1', '72 14 3 1', '9 14 3 0'], answer: 1, explain: 'Арифметика bash целочисленная: 7/2 = 3, 7%2 = 1; 7+2 = 9, 7*2 = 14.', section: 'arith', diff: 2 },
    { id: 'sh-08', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "x=10\nlet \"x-=1\"\nlet \"x*=2\"\nx=$(($x-3))\necho $x", options: ['15', '17', '9', '14'], answer: 0, explain: 'x = 10 → let "x-=1" → 9 → let "x*=2" → 18 → x=$(($x-3)) → 15.', section: 'arith', diff: 2 },
    { id: 'sh-09', type: 'code', lang: 'bash', q: 'Script welcome.sh запущен как ./welcome.sh Pippo Pluto Topolino. Что он выведет?', code: "#!/bin/bash\necho \"Benvenuti $1 e $2!\"", options: ['Benvenuti Pippo e Pluto!', 'Benvenuti Pippo e Pluto Topolino!', 'Benvenuti ./welcome.sh e Pippo!', 'Benvenuti $1 e $2!'], answer: 0, explain: '$1 = Pippo, $2 = Pluto; третий аргумент не используется. $0 был бы ./welcome.sh.', section: 'builtin', diff: 1 },
    { id: 'sh-10', type: 'code', lang: 'bash', q: 'Script запущен как ./count.sh a "b c" d. Что он выведет?', code: "#!/bin/bash\necho $#", options: ['3', '4', '5', '2'], answer: 0, explain: '$# — число positional parameters. "b c" в кавычках — один аргумент: a, "b c", d → 3.', section: 'builtin', diff: 2 },
    { id: 'sh-11', type: 'single', q: 'Какая built-in variable содержит process ID текущего shell?', options: ['$!', '$?', '$$', '$#'], answer: 2, explain: '$$ — PID текущего shell; $! — PID последней background-команды; $? — exit status; $# — число аргументов.', section: 'builtin', diff: 1 },
    { id: 'sh-12', type: 'code', lang: 'bash', q: 'Script запущен как ./s.sh x "y z". Сколько строк он выведет?', code: "#!/bin/bash\nfor a in \"$*\"; do echo \"[$a]\"; done\nfor a in \"$@\"; do echo \"<$a>\"; done", options: ['2', '3', '4', '5'], answer: 1, explain: '"$*" — одно слово [x y z] → 1 строка; "$@" — каждый аргумент отдельно: «x» и «y z» → 2 строки. Итого 3.', section: 'builtin', diff: 3 },
    { id: 'sh-13', type: 'code', lang: 'bash', q: 'Пользователь вводит сначала 3, затем 7. Какая строка с Diff будет выведена?', code: "#!/bin/bash\necho \"Give me the first number:\"\nread num1\necho \"Give me the second number:\"\nread num2\n# results\necho \"Sum: $((num1 + num2))\"\necho \"Diff: $((num1 - num2))\"\necho \"Product: $((num1 * num2))\"", options: ['Diff: 4', 'Diff: -4', 'Diff: 3-7', 'Diff: 10'], answer: 1, explain: 'num1 = 3, num2 = 7 → $((num1 - num2)) = -4.', section: 'read', diff: 1 },
    { id: 'sh-14', type: 'code', lang: 'bash', q: 'Что выведет script?', code: "#!/bin/bash\ni=\"abc\"\nj=\"def\"\n[ $j != $i ]\necho $?", options: ['0', '1', 'true', 'def'], answer: 0, explain: '"def" != "abc" — истина, поэтому test возвращает status 0, и $? = 0.', section: 'if', diff: 2 },
    { id: 'sh-15', type: 'code', lang: 'bash', q: 'Что выведет фрагмент? (строки разделены |)', code: "[ 10 -lt 9 ]\necho $?\n[ 5 -gt 3 -a -z \"\" ]\necho $?", options: ['0 | 1', '1 | 0', '1 | 1', '0 | 0'], answer: 1, explain: '10 -lt 9 ложно → $? = 1. Во втором test: 5 -gt 3 истинно, -z "" (пустая строка) истинно, -a (AND) → истина → 0.', section: 'if', diff: 2 },
    { id: 'sh-16', type: 'code', lang: 'bash', q: 'Что произойдёт при запуске?', code: "n=5\nif [$n -lt 10]\nthen\n  echo \"one digit\"\nelse\n  echo \"two digits\"\nfi", options: ['Выведет one digit', 'Ошибка [5: command not found, затем выведет two digits', 'Синтаксическая ошибка, script ничего не выполнит', 'Выведет one digit и two digits'], answer: 1, explain: 'Без пробелов после [ и перед ] shell ищет команду «[5», не находит (status 127 ≠ 0) → выполняется ветка else.', section: 'if', diff: 3 },
    { id: 'sh-17', type: 'multi', q: 'Какие операторы test сравнивают ЦЕЛЫЕ ЧИСЛА? (несколько ответов)', options: ['-eq', '-lt', '=', '-z', '-ge', '!='], answer: [0, 1, 4], explain: '-eq -ne -gt -lt -ge -le — integer comparisons. = и != сравнивают строки, -z проверяет пустую строку.', section: 'if', diff: 1 },
    { id: 'sh-18', type: 'code', lang: 'bash', q: 'Пользователь вводит 20. Что выведет последняя строка?', code: "#!/bin/bash\n# Prompt the user to enter a number\necho \"Enter a number:\"\nread number\n# Check the range using logical operators\nif [ $number -gt 0 ] && [ $number -le 10 ]; then\necho \"The number is between 1 and 10\"\nelif [ $number -gt 10 ] && [ $number -le 20 ]; then\necho \"The number is between 11 and 20\"\nelif [ $number -gt 20 ]; then\necho \"The number is greater than 20\"\nelse\necho \"The number is 0 or less\"\nfi", options: ['The number is between 1 and 10', 'The number is between 11 and 20', 'The number is greater than 20', 'The number is 0 or less'], answer: 1, explain: '20 -gt 10 && 20 -le 20 — истина во второй ветке (граница 20 включена через -le).', section: 'brackets', diff: 2 },
    { id: 'sh-19', type: 'code', lang: 'bash', q: 'Что выведет фрагмент? (строки разделены |; сообщения об ошибках не учитываются)', code: "file=\"my file.txt\"\ntouch \"$file\"\nif [ -f $file ]; then echo yes; else echo no; fi\nif [[ -f $file ]]; then echo yes; else echo no; fi", options: ['yes | yes', 'no | yes', 'yes | no', 'no | no'], answer: 1, explain: 'В [ ] без кавычек $file разбивается на два слова: [ -f my file.txt ] → ошибка «binary operator expected», status ≠ 0 → no. [[ ]] корректно обрабатывает пробелы → yes.', section: 'brackets', diff: 3 },
    { id: 'sh-20', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "x=10\ny=3\nif [[ $x > 5 && $y < 10 ]]; then echo yes; else echo no; fi", options: ['yes', 'no', 'Ошибка синтаксиса', 'Ничего'], answer: 1, explain: 'В [[ ]] символы > и < сравнивают СТРОКИ лексикографически: "10" > "5" ложно (\'1\' < \'5\'). Для чисел нужен -gt.', section: 'brackets', diff: 3 },
    { id: 'sh-21', type: 'tf', q: 'Конструкция [[ ]] работает в любом shell, включая pure sh.', answer: false, explain: '[[ — улучшение bash; в pure sh не работает.', section: 'brackets', diff: 1 },
    { id: 'sh-22', type: 'code', lang: 'bash', q: 'Example 7 запущен как ./check.sh /etc /tmp. Что произойдёт?', code: "#!/bin/bash\n# Check if exactly one argument was provided\nif test \"$#\" -ne 1; then\n  echo \"Error in the number of parameters\"\n   exit 1\nfi\n# Check if the argument is a file, directory or neither\nif test -f \"$1\"; then\n  echo \" $1 is a file.\"\nelif test -d \"$1\"; then\n  echo \"$1 is a directory.\"\nelse\n  echo \"$1 is neither a file nor a directory.\"\nfi", options: ['/etc is a directory.', 'Error in the number of parameters, script завершится с exit status 1', '/etc is a directory. и /tmp is a directory.', '/etc /tmp is neither a file nor a directory.'], answer: 1, explain: '$# = 2 ≠ 1 → первая проверка печатает ошибку и делает exit 1, до проверок -f/-d не доходит.', section: 'filetests', diff: 2 },
    { id: 'sh-23', type: 'code', lang: 'bash', q: 'Exercise 1: для файла нужно вывести первые 10 строк. Файл report.txt содержит числа 1…15 по строке. Что выведет ./ex1.sh report.txt и в чём ошибка?', code: "#!/bin/bash\n\nif test $# -ne 1\n\tthen echo \"parametri non corretti\"\n\nelif test -d \"$1\"\n\tthen echo $1\n\tls $1 |wc -l\nelif test -f \"$1\"\n\tthen head -c 10 $1\nfi", options: ['Строки 1…10 — ошибки нет', 'Строки 1…5: head -c 10 выводит 10 байт, а нужен head -n 10', 'Число 15: команда считает строки', 'parametri non corretti'], answer: 1, explain: 'head -c 10 печатает первые 10 символов: «1\\n2\\n3\\n4\\n5\\n» — это 10 байт. Для первых 10 строк нужен head -n 10.', section: 'filetests', diff: 2 },
    { id: 'sh-24', type: 'code', lang: 'bash', q: 'Script запущен с аргументом bcd. Что он выведет?', code: "case $1 in\naa|ab) echo A ;;\nb?)      echo B ;;\nc*)      echo C ;;\n*)       echo D ;;\nesac", options: ['A', 'B', 'C', 'D'], answer: 3, explain: 'b? — ровно два символа (b + один любой), bcd не подходит; c* и aa|ab тоже нет → *) → D.', section: 'case', diff: 2 },
    { id: 'sh-25', type: 'code', lang: 'bash', q: 'Пользователь вводит 10. Что выведет script (после приглашения)?', code: "#!/bin/bash\necho -n \"Enter a number 1 < x < 10: \"\nread x\ncase $x in\n1) echo \"Value of x is 1.\";;\n2) echo \"Value of x is 2.\";;\n3) echo \"Value of x is 3.\";;\n4) echo \"Value of x is 4.\";;\n5) echo \"Value of x is 5.\";;\n6) echo \"Value of x is 6.\";;\n7) echo \"Value of x is 7.\";;\n8) echo \"Value of x is 8.\";;\n9) echo \"Value of x is 9.\";;\n0 | 10) echo \"wrong number.\";;\n*) echo \"Unrecognized value.\";;\nesac", options: ['Value of x is 1.', 'wrong number.', 'Unrecognized value.', 'Value of x is 10.'], answer: 1, explain: 'Шаблон 0 | 10) — альтернатива: 10 совпадает → wrong number. Шаблон 1) требует точного совпадения, 10 ему не равен.', section: 'case', diff: 1 },
    { id: 'sh-26', type: 'code', lang: 'bash', q: 'Example 8 запущен как ./ex8.sh Apple.txt. Что он выведет?', code: "#!/bin/bash\n# Check if exactly one argument was provided\nif test \"$#\" -ne 1; then\n  echo \"Error: Please provide a single filename as an argument.\"\n  exit 1\nfi\n# Use the case structure to check if $1 starts with \"a\" in lowercase\ncase \"$1\" in\n  a*)\n    echo \"The filename starts with 'a'.\"\n    ;;\n  *)\n    echo \"The filename does not start with 'a'.\"\n    ;;\nesac", options: ["The filename starts with 'a'.", "The filename does not start with 'a'.", 'Error: Please provide a single filename as an argument.', 'Ничего'], answer: 1, explain: 'Шаблоны case чувствительны к регистру: Apple.txt начинается с заглавной A, a* не совпадает → ветка *).', section: 'case', diff: 2 },
    { id: 'sh-27', type: 'code', lang: 'bash', q: 'Что выведет script?', code: "#!/bin/bash\nlet sum=0\nfor num in 2 4 6\ndo\nlet \"sum = $sum + $num\"\ndone\necho $sum", options: ['6', '12', '246', '0'], answer: 1, explain: 'sum = 0 + 2 + 4 + 6 = 12: let вычисляет арифметическое выражение на каждой итерации.', section: 'for', diff: 1 },
    { id: 'sh-28', type: 'code', lang: 'bash', q: 'Что выведет C-style for?', code: "for ((i=1; i<=10; i+=3))\ndo\n  echo -n \"$i \"\ndone", options: ['1 4 7', '1 4 7 10', '1 2 3 … 10', '3 6 9'], answer: 1, explain: 'i = 1, 4, 7, 10 (10 <= 10 — ещё выполняется), затем i = 13 — выход.', section: 'for', diff: 2 },
    { id: 'sh-29', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "n=5\nn+=1\ns=\"ab\"\ns+=\"cd\"\necho \"$n $s\"", options: ['6 abcd', '51 abcd', '6 ab+cd', '5 cd'], answer: 1, explain: 'Без let/$(( )) оператор += работает со строками: "5" + "1" → "51"; "ab" + "cd" → "abcd".', section: 'strings', diff: 3 },
    { id: 'sh-30', type: 'code', lang: 'bash', q: 'Пользователь вводит 2. Что выведет script? (строки разделены |)', code: "#!/bin/bash\nread x\nsum=0\ni=0\nwhile [[ $i -le $x ]]; do\n     let \"sum = sum + i\"\n        i=$i+1\n    done\necho \"sum=$sum\"\necho \"i=$i\"", options: ['sum=3 | i=3', 'sum=3 | i=0+1+1+1', 'sum=6 | i=3', 'Бесконечный цикл'], answer: 1, explain: 'i=$i+1 присваивает строку («0+1», «0+1+1»…), но [[ -le ]] и let вычисляют её арифметически, поэтому цикл корректен: 0+1+2 = 3. echo печатает саму строку i.', section: 'while', diff: 3 },
    { id: 'sh-31', type: 'code', lang: 'bash', q: 'Script запущен как ./s.sh a b c. Что он выведет? (строки разделены |)', code: "#!/bin/bash\nwhile [ $# -gt 1 ]\ndo\n  echo $1\n  shift\ndone\necho \"last: $1\"", options: ['a | b | c | last: ', 'a | b | last: c', 'a | last: b', 'a | b | c | last: c'], answer: 1, explain: 'Цикл идёт, пока аргументов больше одного: печатает a, shift, печатает b, shift; остаётся $# = 1 → выход, last: c.', section: 'while', diff: 2 },
    { id: 'sh-32', type: 'code', lang: 'bash', q: 'Exercise 4 запущен как ./reverse.sh 1200. Какая последняя строка вывода?', code: "if [ $# -ne 1 ]\nthen\n  echo \"Please provide a number as input in the script\"\n  exit 1\nfi\nn=$1\nrev=0\nsd=0\nwhile [ $n -gt 0 ]\n  do\n  sd=`expr $n % 10`\n  echo $sd\n  rev=`expr $rev \\* 10  + $sd`\n  n=`expr $n / 10`\ndone\necho  \"Reverse number is $rev\"", options: ['Reverse number is 0021', 'Reverse number is 21', 'Reverse number is 2100', 'Reverse number is 1200'], answer: 1, explain: 'Цифры справа налево: 0, 0, 2, 1; rev = 0 → 0 → 2 → 21. Число, а не строка, поэтому ведущих нулей нет.', section: 'while', diff: 3 },
    { id: 'sh-33', type: 'code', lang: 'bash', q: 'Пользователь вводит 3. Какие числа напечатает until?', code: "#!/bin/bash\nread x\nuntil test $x -le 0; do\n  echo $x\n  let \"x=x-1\"\ndone\necho GO !", options: ['3 2 1 0', '3 2 1', '2 1 0', 'Ничего: условие сразу ложно'], answer: 1, explain: 'until повторяет, пока условие ($x -le 0) ложно: x = 3, 2, 1 печатаются; при x = 0 условие истинно — выход, затем GO !.', section: 'while', diff: 2 },
    { id: 'sh-34', type: 'code', lang: 'bash', q: 'Что выведет фрагмент?', code: "pet[0]=dog\npet[1]=cat\npet[2]=fish\npet[4]=apple\necho ${#pet[*]}", options: ['3', '4', '5', 'apple'], answer: 1, explain: '${#pet[*]} — число элементов, а не максимальный индекс + 1: заданы индексы 0, 1, 2, 4 → 4 элемента (pet[3] не существует).', section: 'arrays', diff: 3 },
    { id: 'sh-35', type: 'code', lang: 'bash', q: 'Что выведет script из «Analyzing scripts»?', code: "MAX=10000\n for((nr=1; nr<$MAX; nr++))\n do\n  let \"t1 = nr % 5\"\n  if [ \"$t1\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t2 = nr % 7\"\n  if [ \"$t2\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t3 = nr % 9\"\n  if [ \"$t3\" -ne 0 ]\n  then\n   continue\n  fi\n break  # What happens when you comment out this line? Why?\n done\n echo \"Number = $nr\"", options: ['Number = 35', 'Number = 315', 'Number = 9999', 'Number = 63'], answer: 1, explain: 'continue пропускает числа, не делящиеся на 5, 7 или 9; первое, делящееся на все три, — 5·7·9 = 315, на нём break.', section: 'analyze', diff: 2 },
    { id: 'sh-36', type: 'code', lang: 'bash', q: 'В том же script строку break закомментировали. Что он выведет?', code: "MAX=10000\n for((nr=1; nr<$MAX; nr++))\n do\n  let \"t1 = nr % 5\"\n  if [ \"$t1\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t2 = nr % 7\"\n  if [ \"$t2\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t3 = nr % 9\"\n  if [ \"$t3\" -ne 0 ]\n  then\n   continue\n  fi\n #break  # What happens when you comment out this line? Why?\n done\n echo \"Number = $nr\"", options: ['Number = 315', 'Number = 9999', 'Number = 10000', 'Бесконечный цикл'], answer: 2, explain: 'Без break цикл доходит до конца: последняя итерация nr = 9999, затем nr++ → 10000, условие nr < MAX ложно — выход. Печатается 10000.', section: 'analyze', diff: 3 },
    { id: 'sh-37', type: 'code', lang: 'bash', q: 'Exercise 6: пользователь вводит hello123. Какая последняя строка вывода?', code: "echo \"Enter your password\"\nread password\nlen=\"${#password}\"\nif test $len -ge 8 ; then\n  echo \"$password\" | grep -q [0-9]\n  if test $? -eq 0 ; then\n     echo \"$password\" | grep -q [A-Z]\n        if test $? -eq 0 ; then\n          echo \"$password\" | grep -q [a-z]\n           if test $? -eq 0 ; then\n           echo \"Strong Password\"\n         else\n           echo \"Weak Password -> Should include a lower case letter.\"\n         fi\n      else\n       echo \"Weak Password -> Should include a capital case letter.\"\n      fi\n  else\n   echo \"Weak Password -> Should use numbers in your password.\"\n  fi\nelse\n  echo \"Weak Password -> Password length should have at least 8 characters.\"\nfi", options: ['Strong Password', 'Weak Password -> Should include a capital case letter.', 'Weak Password -> Should include a lower case letter.', 'Weak Password -> Password length should have at least 8 characters.'], answer: 1, explain: 'Длина 8 (≥ 8) — ок; цифры есть ($? = 0); [A-Z] не найдено → grep -q возвращает 1 → сообщение про capital case letter.', section: 'ex6', diff: 2 },
    { id: 'sh-38', type: 'code', lang: 'bash', q: 'Example 1 (hello.sh) запускают второй раз в том же каталоге. Что произойдёт?', code: "#!/bin/bash --\nmkdir hello\necho \"hello guys!\" > hello/hello.txt", options: ['mkdir выдаст ошибку File exists, но echo всё равно перезапишет hello.txt — в нём одна строка', 'mkdir выдаст ошибку, и script сразу завершится', 'В hello.txt станет две строки hello guys!', 'Будет создан каталог hello/hello'], answer: 0, explain: 'Ошибка команды не останавливает script — выполняется следующая строка. > перезаписывает файл (а не дописывает, как >>), поэтому строка одна.', section: 'examples', diff: 2 }
  ]
});
