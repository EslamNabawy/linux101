---
title: Linux Administration & Fundamentals Notes
author: Rahmas
category: Linux Course
tags: [system-architecture, virtual-machines, filesystem, file-management, links, grep]
source: 1787225668706_Rahmas.md
---

# Linux Administration & Fundamentals Notes
*Notes by Rahmas*

Notes covering system architecture concepts (monolithic vs. microservices, Linux vs. Unix), VM and network setup, shell prompt and CLI syntax, the filesystem hierarchy, file and directory management, hard/soft links, and text searching with `grep` and wildcards.

## 1. System Architecture & Concepts

- **Monolithic vs Microservices**: If one service fails in a monolithic architecture, all services are down. In microservices, if one service goes down, the rest of the services remain up.
- **Load Balancer**: Works on balancing traffic across the services.
- **RabbitMQ**: Acts as a queue for services.
- **Virtual Memory (Swap)**: Avoids system crashes. Example: Activate Swap when uploading on AWS.

### Linux vs Unix

| Aspect | Linux (Open Source) | Unix (Closed Source) |
|---|---|---|
| Origin | Came after Unix; contains around 400 distributions | Came first |
| Customization | Customized (including UI) | Couldn't be customized |
| License | No license, open for everybody (public), and free (some are licensed but with nuances) | Private for the developers |
| Example | — | Unix is an example of a closed-source system |

- **Enterprise Revenue**: Money comes from certifications and subscription fees for enterprise editions.

### Distributions Comparison

- Differences between Fedora vs RedHat: Number of versions and releases from each version.
- Ubuntu vs RedHat: You can use Ubuntu on VMware; the difference is mainly in the packages, but the command lines are the same.
- CentOS: Noted for having "no security" (EOL).

- **GPL (General Public License)**: Associated with Richard Stallman.

## 2. Virtual Machine & Network Setup

- **Creating a VM**: `File` -> `New VM` -> `Installing Redhat on VMware` (Recommended: 2 processors, 2 cores).
- **Network Types**: Bridged, NAT, Host-only (chosen according to the IP range).
  - Choose **NAT** when setting up VMware.
- **Redhat Developer Account**: You can use developer account credentials to log in to a Redhat server with a GUI on VMware.

### Getting IP & SSH

```bash
ifconfig
```
Returns the IP address (Skip this step for Ubuntu).

```bash
ssh root@ipaddress
```
Connects to the server.

## 3. Shell Prompt & Basic CLI Syntax

- **Default Shell in Redhat**: Bash
- **CLI (Command Line Interface)** syntax: `Command [Option] [Argument]`
  - Dash `[option]` has "no spaces" (e.g., `-V`).
  - You must have a space after the `[command]`.
  - There could be no `[argument]` in CLI (used for modification/determining action).

### Combining Options

Options can be combined.

- Example: `-l -d` (Correct), `-ld` (Correct), `-l d` (Incorrect).

### Terminal Shortcuts

| Shortcut | Description |
|---|---|
| `Win + ↑` | Maximize terminal |
| `Ctrl + U` | Delete all the part of the command before the cursor |
| `Ctrl + K` | Delete all the part of the command after the cursor |
| `cd [tab][tab]` | Displays all files with the same initial |
| `cd [tab]` | Auto-completes file name initial |

### History Commands

| Command | Description |
|---|---|
| `!500` | Runs command number 500 in history |
| `!!` | Runs the last command in history |

### Switching Users

```bash
su - username
```
Switches user (prompts for password).

## 4. File System Hierarchy

| Directory | Description |
|---|---|
| `/` | Root file system (like Local Disk C). Contains everything underneath it *(تحته)* |
| `root` | System user (Admin). `/root` contains the Super user profile |
| `home` | Contains any regular user profile |
| `bin` | Regular user data related ("shortcut" / "symbolic link") |
| `sbin` | Super user data related ("shortcut" / "soft link") |
| `boot` | Booting OS files |
| `etc` | All config files |
| `dev` | All hardware components |
| `run` | Any files related to services ("not shortcut", "different") |
| `var` | Any variable in the system. Contains a `tmp` that clears every 30 days |
| `tmp` | Temporary files (clears every 10 days). Both `tmp` and `/var/tmp` are caches |
| `usr` | The original system directory *(الأصلي)* |

## 5. File & Directory Management

### Navigation (`cd`, `pwd`)

- **Shell prompt**: `[root@server ~]` -> `~` refers to the home directory.
  - For regular users: `/home/regularuser`
  - For root: `/root`

| Command | Description |
|---|---|
| `cd ~` / `cd` | Return to the home directory (whether regular or superuser) |
| `cd -` | One step backwards (previous directory) |
| `cd ..` | Move up one level (relative path) |

- **Absolute path**: The entire path.
- **Relative path**: Not the entire path.

### Listing (`ls`, `tree`)

| Command | Description |
|---|---|
| `ls` | List files in the directory |
| `ls -a` | List all files, whether hidden or non-hidden (Hidden files start with a dot) |
| `ls -l` | Long list |
| `ls -r` | Reversed list |
| `ls -h` | Converts bits to bytes (human-readable) |
| `ls -lthr` | Long list, human-readable, sorted by time, reversed |
| `ls -lR` | Recursive list (lists all the content of the directory, whether files or directories) |
| `tree` | Shows directory structure visually |

### File Creation, Copying & Moving

```bash
mkdir dir1
```
Make directory.

```bash
mkdir -p
```
Make parent directories (e.g., `mkdir -p "Rahma Tarek"` vs `mkdir "Roaa Tarek"` vs `mkdir Ayah Tarek`).

```bash
touch file1
```
Create an empty file.

`cp`: Copying files. Copies are not connected to each other (unlike links).

```bash
cp -r NTI /root
```
For copying a directory.
*(بناخد الـ NTI كوبي ونحطه جوا الـ root / copy الـ NTI الاصلية جوا الـ root اللي هو الـ home directory)*

`mv`: "Cut" or "Rename" depending on whether you provide a path to paste or just a new name.

### Deleting (`rm`)

| Command | Description |
|---|---|
| `rm file2` | Asks to verify |
| `rm -f file2` | Deletes without inquiry (force) |
| `rm -r dir1` | Removes directory recursively (asks to verify) |
| `rm -fr dir1` | Removes directory recursively without inquiry |

> [!WARNING]
> `rm -fr dir1` removes a directory recursively without asking for confirmation. Double-check the target before running it.

### Viewing File Content

| Command | Description |
|---|---|
| `cat /etc/<file>` | List the content of the file |
| `less /etc/<file>` | Instead of `cat`, more organized, allows scrolling & using `Space` to move to the next page |
| `head /etc/<file>` | First 10 lines |
| `head -n 5 /etc/<file>` | First 5 lines |
| `head /etc/file1 /etc/file2` | First 10 lines from both files |
| `tail /etc/<file>` | Last lines |
| `tail -n 5 /etc/<file>` | Last 5 lines |

## 6. Links (Hard Links vs. Soft Links)

| Behavior | Soft Link | Hard Link |
|---|---|---|
| Inode | Different inode | Same inode |
| Relationship to source | It's just a pointer to the original file | Both files are real-time aligned (connected to each other) |
| Size | The soft link size is not related to the original file size, as it's only a pointer | The file size is the same as the hard link size |
| Creation | `ln -s /etc soft-link` | `ln <source> <link>` |

```bash
ls -i
```
Displays inodes.

## 7. Search & Pattern Matching (`grep` & Wildcards)

### Wildcards (Rules of naming files)

| Pattern | Meaning |
|---|---|
| `ls [fa]*` | Matches any file starting with `f` or `a` |
| `ls [a-c]*` | Any file starting with one of these letters (`a`, `b`, `c`) |
| `ls [!fa]*` / `ls [^a-f]*` / `ls [!a-f]*` | Any file that does not start with one of these letters |
| `ls [~a-c]*` | Any file starting with one of these letters |

### Text Searching (`grep`)

| Command | Description |
|---|---|
| `grep omar /etc/passwd` | Searches for "omar" |
| `grep -i omar /etc/passwd` | "Not case-sensitive" |
| `grep -l Karim /etc/passwd` | If there is "Karim", returns the file path only; if not found, returns nothing |
| `grep -A 2 Ali /etc/passwd` | Returns the line itself & 2 lines After |
| `grep -B 2 Ali /etc/passwd` | Returns the line itself & 2 lines Before |
| `grep -e omar -e Ali /etc/passwd` | Searching for 2 words at the same time |
| `grep ^cat /etc/passwd` | Returns any word that starts with "cat" |
| `grep c.t /etc/passwd` | One letter in between 'c' and 't' |
| `grep ^c..t$ /etc/passwd` | Starts with 'c' & ends with 't' with exactly 2 letters in between |

## Flashcards

**Q: What's the key difference between monolithic and microservices architecture when one service fails?**
A: In a monolithic architecture, if one service fails, all services go down. In microservices, if one service goes down, the rest of the services remain up.

**Q: What role does a Load Balancer play, and what does RabbitMQ do?**
A: A Load Balancer balances traffic across services, while RabbitMQ acts as a queue for services.

**Q: Why would you activate Swap (Virtual Memory), and give an example?**
A: To avoid system crashes — for example, activating Swap when uploading on AWS.

**Q: What's the core difference between Linux and Unix in terms of source model?**
A: Linux is open source — customizable (including UI), no license, open to the public, and free (though some editions are licensed with nuances). Unix is closed source — private to its developers and not customizable.

**Q: Who is the GPL (General Public License) associated with?**
A: Richard Stallman.

**Q: What network type should you choose when setting up VMware, per these notes?**
A: NAT.

**Q: What does `ifconfig` do, and is it needed on Ubuntu?**
A: It returns the IP address; this step can be skipped for Ubuntu.

**Q: What is the correct way to combine CLI options, and which format is incorrect?**
A: `-l -d` and `-ld` are both correct ways to combine options; `-l d` is incorrect.

**Q: What do `Ctrl+U` and `Ctrl+K` do in the terminal?**
A: `Ctrl+U` deletes the part of the command before the cursor; `Ctrl+K` deletes the part of the command after the cursor.

**Q: What do `!500` and `!!` do in shell history?**
A: `!500` runs command number 500 from history; `!!` runs the last command in history.

**Q: What's the difference between `/bin` and `/sbin` per these notes?**
A: `/bin` is regular user data related ("shortcut"/"symbolic link"), while `/sbin` is super user data related ("shortcut"/"soft link").

**Q: How often do `/tmp` and `/var/tmp` clear, and what do they have in common?**
A: `/tmp` clears every 10 days, and `/var/tmp` clears every 30 days; both are caches.

**Q: What does `~` refer to in the shell prompt, for a regular user vs. root?**
A: `~` refers to the home directory — `/home/regularuser` for a regular user, and `/root` for the root user.

**Q: What's the difference between `cd -` and `cd ..`?**
A: `cd -` moves one step backwards to the previous directory; `cd ..` moves up one level in the directory tree (relative path).

**Q: What does `ls -lthr` do?**
A: Produces a long-format, human-readable listing sorted by time, in reversed order.

**Q: What's the difference between `rm -r dir1` and `rm -fr dir1`?**
A: `rm -r dir1` removes a directory recursively but asks to verify first; `rm -fr dir1` removes it recursively without asking for confirmation.

**Q: What's the difference between `cat` and `less` for viewing file content?**
A: `cat` lists the full content of the file at once, while `less` is more organized and allows scrolling, using `Space` to move to the next page.

**Q: What's the difference between a soft link and a hard link in terms of inode and size?**
A: A soft link has a different inode from the source and is just a pointer, so its size is unrelated to the original file's size. A hard link shares the same inode as the source, and its file size matches the source file's size.

**Q: What does `ls -i` show?**
A: It displays the inode numbers of files.

**Q: What does `grep -l Karim /etc/passwd` return if "Karim" is not found in the file?**
A: It returns nothing (no output), since `-l` only returns the file path when a match is found.

**Q: What does the pattern `grep ^c..t$ /etc/passwd` match?**
A: Lines that start with 'c' and end with 't', with exactly 2 letters in between.
