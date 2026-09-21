---
title: Linux Fundamentals - Bash, Redirection, Vim, and Pipelines
author: UNKNOWN — set manually
category: Linux Course
tags: [bash, redirection, vim, pipelines, manual-pages, shell-variables]
source: notes.md
---

# Linux Fundamentals - Bash, Redirection, Vim, and Pipelines
*Notes by UNKNOWN — set manually*

Daily notes covering Bash search commands, I/O redirection and standard streams, manual page navigation, Vim modes and shortcuts, shell variables, and pipelines with filtering commands.

## 25 September (Wednesday) — Vim Scripting, External Commands, Shell Variables

### Vim Script: Find and Replace

```
:%s/login/nologin/g
```

`g` means Global (to replace the words).
*(new name)*

### Execute External Command in Vim

```
:.! date
```
*(خارج ولكن يعود للمكان مره ثانيه)*

```
:* Number ! Command
```

Will appear in the number of line that matches that number.

### Vim Options

| Command | Description |
|---|---|
| `:set number` | Will index the lines |
| `:set arabic` | Will make in arabic way |
| `:set noarabic` | Turns off arabic mode |

### Variables in Shell

User-defined Variable / Shell Variable — that you created / that already exists in the system or the user created it.

```bash
X=15
echo $X
```

### Mathematics in Shell

```bash
$[x+y]
echo $[x+y]
```

## 26 September (Thursday) — Vim Search and Editing

### Search Direction

| Command | Description |
|---|---|
| `?` | Search from bottom |
| `/` | Search from above |
| `ESC` / exit | To get out of Mode |

### Cursor Insertion & Movement

| Command | Description |
|---|---|
| `a` | After Cursor |
| `i` | Before Cursor |
| `o` | New next line |
| `Shift + A` | End of line |
| `Shift + I` | Beginning of line |

### Editing Operations

Everything you write, the exit option applies.

| Command | Description |
|---|---|
| `dd` | Only to remove |
| `dd` + `p` | Cut -> Copy |

### Visual Modes

| Command | Description |
|---|---|
| `v` | To get Visual Mode |
| `Shift + V` | Select the line |
| `Ctrl + v` | Select the block *(لعمود)* |

### Saving & Exiting Vim

| Command | Description |
|---|---|
| `:w` | Save and keep in file |
| `:wq` | Save and get out |
| `:q!` | Not save and quit |
| `:q` | He will ask you (if you have done save you will get out immediately) |

## 27 September (Friday) — /dev/null and Vi/Vim Modes

### /dev/null in Linux

A special virtual device file. Acts like a black hole for data. Any data will disappear.

> [!NOTE]
> `/dev/null` is a special virtual device file that acts like a black hole for data — anything sent to it disappears.

### Vi / Vim Modes

```bash
Vi / Vim <filename>
```
To execute into the file.

4 level modes:

| Mode | Description |
|---|---|
| Default | Command Mode |
| Update | Insert Mode |
| Select | Visual Mode |
| Ex / Command Line Mode | — |

After you end, to exit -> press `ESC`.

Press `i` -> Go to Insert Mode.

Save or Not save: `Shift + :`

### Vim Shortcuts

| Command | Description |
|---|---|
| `dd` | Cut / Delete line |
| `yy` / `gy` | Copy |
| `p` | Paste |
| `u` | Undo |
| `/` | Search |

## 28 September (Saturday) — Pipelines

```bash
find / -name passwd 2> temp/temp-output
```

### Pipelines

Input -> Output -> Command engine in that output

Pass process -> gives you total output (will use it).

```
Command | output -> Command -> output
```

Real Example:

```bash
ls -l | grep ^-
```

Give filter output.

```bash
echo "nti aiops" | wc
```

Print / Counted 'Count' word.

### wc Options

| Command | Description |
|---|---|
| `wc -l` | Lines only |
| `wc -w` | Words only |
| `wc -c` | Character only |

### Search Pattern

`\<th` -> Any word having "th"

delimiter

## 29 September (Sunday) — Bash find and Standard Output/Error

```bash
find / -name <option>
```

`option` -> Command anything.

Mean: search for entire system.
*(أنت بتحدد عادي هنا المكان)*

> [!NOTE]
> You may have two std output and std Error. It will get only one of them unless you specify otherwise.

Example:

```bash
find / -name passwd > output
```

Also has Error but it only gets the output.

`2>` -> If you want to get the Error.

## 30 September (Monday) — Redirection and Manual Pages

### Redirection

Redirection -> to change info to another page.

| Stream | File Descriptor |
|---|---|
| std input | FD0 |
| std output | FD1 |
| std Error | FD2 |

Any Command / Any Program / Standard STDs.

Values not be typed.

The next or another file doesn't know what you give Std to make it understand.

```bash
ls -l > /temp/temp-output
```

Also makes override.

To append: `>>`

`1>` -> Will not center / output redirect.

```bash
anything > temp-erro-output
```

Error here: `2>`

It will understand that is error.

> [!WARNING]
> `>` overrides the target file's contents. Use `>>` to append instead of overwriting.

### Manual Pages & Vim Navigation

`/etc` -> Have all Configuration file in system.

4 Command to get to home (?)

### Manual Page Sections

| Section | Description |
|---|---|
| 1 | User Command (regular page) |
| 5 | Configuration files |
| 8 | System Administrator commands |

```bash
whereis Command
```

Gives you where the Command is on pages.

### Vim / Navigation Shortcuts

| Command | Description |
|---|---|
| `Shift + G` | To get the last of file |
| `g` (small g) | To get the first of file |
| `Shift + N` | Will search for same word (previous match) |
| `/ <word>` | Search for word |
| `Q` | To quit |

```bash
man passwd
man 5 passwd
```

## 1 October (Tuesday) — Manual Page Lookups

Manual page needed to update: `mandb`

What is `man passwd` ~ Word

```bash
man -k passwd
```

`man -w passwd` = Where is to all page. First one *(كلمتين)*.

Get the first location (if it not press Q) and it asks you if you want to see the next page -> press Enter.

What if the change in file name? It will not get it.

It also returns Path.

نمشي بالترتيب

Page 1

```bash
Command --help
```

Return option only.

But if you want description:

`man` -> It's like documentation.

## Flashcards

**Q: What does `find / -name <option>` do?**
A: Searches the entire system starting from root for files matching the given name.

**Q: What's the difference between FD1 and FD2?**
A: FD1 is standard output (std output), and FD2 is standard error (std Error).

**Q: How do you redirect only the error output of a command, and how do you get both output and error separately?**
A: Use `2>` to redirect only the error stream; without specifying, a command's normal output goes to std output and only one stream is captured unless you redirect explicitly (e.g. `2>` for errors).

**Q: What's the difference between `>` and `>>`?**
A: `>` overrides the destination file's contents, while `>>` appends to it instead of overwriting.

**Q: What is `/dev/null`?**
A: A special virtual device file that acts like a black hole for data — anything written to it disappears.

**Q: What are the main manual page sections mentioned?**
A: Section 1 is User Commands (regular page), Section 5 is Configuration files, and Section 8 is System Administrator commands.

**Q: What's the difference between `man -k passwd` and `man -w passwd`?**
A: `man -k passwd` searches man page descriptions for "passwd" as a keyword, while `man -w passwd` shows the location/path of the passwd man page.

**Q: What does `Command --help` return compared to `man Command`?**
A: `--help` returns only the options for the command, while `man` acts as full documentation/description.

**Q: What are the four Vim modes?**
A: Command Mode (default), Insert Mode (update), Visual Mode (select), and Ex/Command Line Mode.

**Q: How do you enter Insert Mode in Vim, and how do you exit any mode?**
A: Press `i` to enter Insert Mode; press `ESC` to exit back to Command Mode.

**Q: What's the difference between `:w`, `:wq`, `:q!`, and `:q`?**
A: `:w` saves and keeps the file open, `:wq` saves and quits, `:q!` quits without saving, and `:q` quits only if there are no unsaved changes (otherwise it prompts).

**Q: What do `dd`, `yy`/`gy`, `p`, and `u` do in Vim?**
A: `dd` cuts/deletes a line, `yy` or `gy` copies a line, `p` pastes, and `u` undoes the last action.

**Q: What's the difference between `v`, `Shift+V`, and `Ctrl+v` in Vim's visual modes?**
A: `v` enters character-wise Visual Mode, `Shift+V` selects entire lines, and `Ctrl+v` selects a block/column *(لعمود)*.

**Q: What does the Vim command `:%s/login/nologin/g` do?**
A: It performs a global find-and-replace across the file, replacing every occurrence of "login" with "nologin".

**Q: What does `:.! date` do in Vim?**
A: It runs the external `date` command and inserts its output, then returns to the same place in the file *(خارج ولكن يعود للمكان مره ثانيه)*.

**Q: What is a pipeline in Bash, and what does `ls -l | grep ^-` do?**
A: A pipeline passes the output of one command as input to another command. `ls -l | grep ^-` filters the long listing to show only regular files (lines starting with `-`).

**Q: What do `wc -l`, `wc -w`, and `wc -c` count?**
A: `wc -l` counts lines only, `wc -w` counts words only, and `wc -c` counts characters only.

**Q: What does the search pattern `\<th` match?**
A: Any word containing "th" (word-boundary search for "th").

**Q: What does `whereis Command` do?**
A: Shows where a command's binary, source, and man page files are located.
