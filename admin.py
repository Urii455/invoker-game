# admin.py
# Расширенная консольная административная панель с системой логирования и управления пользователями
# Общее количество строк: ~420 (включая комментарии и документацию)

import json
import os
import datetime
import hashlib
import getpass
import shutil
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

# ================== Класс для уровней доступа ==================
class UserRole(Enum):
    GUEST = 0
    USER = 1
    MODERATOR = 2
    ADMIN = 3
    SUPER_ADMIN = 4

# ================== Структура пользователя ==================
@dataclass
class User:
    username: str
    password_hash: str
    email: str
    role: UserRole
    created_at: str
    last_login: str
    is_active: bool = True
    login_attempts: int = 0

# ================== Система логирования ==================
class Logger:
    def __init__(self, log_file: str = "admin_log.txt"):
        self.log_file = log_file
        self._ensure_log_file()

    def _ensure_log_file(self):
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', encoding='utf-8') as f:
                f.write("# Лог административной панели\n")

    def _get_timestamp(self) -> str:
        return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def log(self, level: str, message: str):
        timestamp = self._get_timestamp()
        log_entry = f"[{timestamp}] [{level.upper()}] {message}\n"
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        print(f"[LOG] {log_entry.strip()}")

    def info(self, message: str):
        self.log("INFO", message)

    def warning(self, message: str):
        self.log("WARNING", message)

    def error(self, message: str):
        self.log("ERROR", message)

    def critical(self, message: str):
        self.log("CRITICAL", message)

# ================== Менеджер пользователей ==================
class UserManager:
    def __init__(self, data_file: str = "users.json", logger: Logger = None):
        self.data_file = data_file
        self.logger = logger or Logger()
        self.users: Dict[str, User] = {}
        self.current_user: Optional[User] = None
        self._load_users()

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def _load_users(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for username, user_data in data.items():
                        role = UserRole(user_data['role']['value'])
                        self.users[username] = User(
                            username=user_data['username'],
                            password_hash=user_data['password_hash'],
                            email=user_data['email'],
                            role=role,
                            created_at=user_data['created_at'],
                            last_login=user_data['last_login'],
                            is_active=user_data.get('is_active', True),
                            login_attempts=user_data.get('login_attempts', 0)
                        )
                self.logger.info(f"Загружено {len(self.users)} пользователей")
            except Exception as e:
                self.logger.error(f"Ошибка загрузки пользователей: {e}")
        else:
            self._create_default_admin()

    def _create_default_admin(self):
        default_admin = User(
            username="admin",
            password_hash=self._hash_password("admin123"),
            email="admin@localhost",
            role=UserRole.SUPER_ADMIN,
            created_at=datetime.datetime.now().isoformat(),
            last_login=""
        )
        self.users["admin"] = default_admin
        self.save_users()
        self.logger.info("Создан пользователь admin с паролем admin123")

    def save_users(self):
        try:
            data = {}
            for username, user in self.users.items():
                data[username] = {
                    'username': user.username,
                    'password_hash': user.password_hash,
                    'email': user.email,
                    'role': {'name': user.role.name, 'value': user.role.value},
                    'created_at': user.created_at,
                    'last_login': user.last_login,
                    'is_active': user.is_active,
                    'login_attempts': user.login_attempts
                }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            self.logger.info("Пользователи сохранены")
        except Exception as e:
            self.logger.error(f"Ошибка сохранения: {e}")

    def authenticate(self, username: str, password: str) -> bool:
        user = self.users.get(username)
        if not user:
            self.logger.warning(f"Неудачная попытка входа: пользователь {username} не найден")
            return False
        if not user.is_active:
            self.logger.warning(f"Попытка входа в заблокированный аккаунт: {username}")
            return False
        if user.password_hash == self._hash_password(password):
            user.last_login = datetime.datetime.now().isoformat()
            user.login_attempts = 0
            self.current_user = user
            self.save_users()
            self.logger.info(f"Успешный вход: {username}")
            return True
        else:
            user.login_attempts += 1
            if user.login_attempts >= 5:
                user.is_active = False
                self.logger.warning(f"Аккаунт {username} заблокирован после 5 неудачных попыток")
            self.save_users()
            self.logger.warning(f"Неверный пароль для {username} (попытка {user.login_attempts})")
            return False

    def add_user(self, username: str, password: str, email: str, role: UserRole) -> bool:
        if username in self.users:
            self.logger.warning(f"Попытка создать существующего пользователя: {username}")
            return False
        new_user = User(
            username=username,
            password_hash=self._hash_password(password),
            email=email,
            role=role,
            created_at=datetime.datetime.now().isoformat(),
            last_login=""
        )
        self.users[username] = new_user
        self.save_users()
        self.logger.info(f"Создан пользователь {username} с ролью {role.name}")
        return True

    def delete_user(self, username: str) -> bool:
        if username == "admin":
            self.logger.warning("Попытка удалить супер-админа")
            return False
        if username in self.users:
            del self.users[username]
            self.save_users()
            self.logger.info(f"Удалён пользователь {username}")
            return True
        return False

    def list_users(self) -> List[Dict]:
        result = []
        for user in self.users.values():
            result.append({
                'username': user.username,
                'email': user.email,
                'role': user.role.name,
                'created_at': user.created_at[:10],
                'is_active': user.is_active
            })
        return result

    def change_role(self, username: str, new_role: UserRole) -> bool:
        if username in self.users:
            self.users[username].role = new_role
            self.save_users()
            self.logger.info(f"Роль {username} изменена на {new_role.name}")
            return True
        return False

    def logout(self):
        if self.current_user:
            self.logger.info(f"Выход пользователя {self.current_user.username}")
            self.current_user = None

# ================== Менеджер задач (Todo) ==================
class TaskManager:
    def __init__(self, task_file: str = "tasks.json", logger: Logger = None):
        self.task_file = task_file
        self.logger = logger or Logger()
        self.tasks = []
        self._load_tasks()

    def _load_tasks(self):
        if os.path.exists(self.task_file):
            try:
                with open(self.task_file, 'r', encoding='utf-8') as f:
                    self.tasks = json.load(f)
            except:
                self.tasks = []

    def _save_tasks(self):
        with open(self.task_file, 'w', encoding='utf-8') as f:
            json.dump(self.tasks, f, indent=2, ensure_ascii=False)

    def add_task(self, title: str, description: str = "", priority: str = "medium"):
        task = {
            'id': len(self.tasks) + 1,
            'title': title,
            'description': description,
            'priority': priority,
            'created': datetime.datetime.now().isoformat(),
            'completed': False
        }
        self.tasks.append(task)
        self._save_tasks()
        self.logger.info(f"Добавлена задача: {title}")
        return task

    def complete_task(self, task_id: int):
        for task in self.tasks:
            if task['id'] == task_id:
                task['completed'] = True
                self._save_tasks()
                self.logger.info(f"Задача {task_id} выполнена")
                return True
        return False

    def list_tasks(self, show_completed: bool = False):
        result = []
        for task in self.tasks:
            if show_completed or not task['completed']:
                result.append(task)
        return result

# ================== Система резервного копирования ==================
class BackupManager:
    def __init__(self, backup_dir: str = "backups", logger: Logger = None):
        self.backup_dir = backup_dir
        self.logger = logger or Logger()
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

    def backup_file(self, filepath: str) -> bool:
        if not os.path.exists(filepath):
            self.logger.error(f"Файл {filepath} не найден для бэкапа")
            return False
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        basename = os.path.basename(filepath)
        backup_name = f"{basename}.{timestamp}.bak"
        backup_path = os.path.join(self.backup_dir, backup_name)
        try:
            shutil.copy2(filepath, backup_path)
            self.logger.info(f"Создан бэкап: {backup_path}")
            return True
        except Exception as e:
            self.logger.error(f"Ошибка бэкапа: {e}")
            return False

    def list_backups(self) -> List[str]:
        return [f for f in os.listdir(self.backup_dir) if f.endswith('.bak')]

# ================== Главное меню администратора ==================
class AdminPanel:
    def __init__(self):
        self.logger = Logger()
        self.user_manager = UserManager(logger=self.logger)
        self.task_manager = TaskManager(logger=self.logger)
        self.backup_manager = BackupManager(logger=self.logger)

    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')

    def print_header(self):
        print("=" * 60)
        print("          АДМИНИСТРАТИВНАЯ ПАНЕЛЬ v2.0")
        print("=" * 60)
        if self.user_manager.current_user:
            role = self.user_manager.current_user.role.name
            print(f"  Пользователь: {self.user_manager.current_user.username} [{role}]")
        print("=" * 60)

    def login_screen(self):
        self.clear_screen()
        self.print_header()
        print("\n  ВХОД В СИСТЕМУ")
        print("-" * 40)
        username = input("  Логин: ").strip()
        password = getpass.getpass("  Пароль: ")
        if self.user_manager.authenticate(username, password):
            self.logger.info(f"Успешный вход: {username}")
            return True
        else:
            print("\n  [ОШИБКА] Неверный логин или пароль!")
            input("\n  Нажмите Enter для повторной попытки...")
            return False

    def show_user_management(self):
        while True:
            self.clear_screen()
            self.print_header()
            print("\n  [1] Список пользователей")
            print("  [2] Добавить пользователя")
            print("  [3] Удалить пользователя")
            print("  [4] Изменить роль")
            print("  [5] Заблокировать/разблокировать")
            print("  [0] Назад")
            choice = input("\n  Выберите действие: ")

            if choice == '1':
                users = self.user_manager.list_users()
                print("\n  " + "-" * 50)
                for u in users:
                    status = "Активен" if u['is_active'] else "Заблокирован"
                    print(f"  {u['username']:15} | {u['email']:20} | {u['role']:12} | {status}")
                input("\n  Нажмите Enter...")

            elif choice == '2':
                if self.user_manager.current_user.role.value < 3:
                    print("  Нет прав!")
                    input()
                    continue
                username = input("  Имя пользователя: ")
                password = getpass.getpass("  Пароль: ")
                email = input("  Email: ")
                print("  Роли: 0-GUEST, 1-USER, 2-MODERATOR, 3-ADMIN, 4-SUPER_ADMIN")
                role_val = int(input("  Выберите роль (0-4): "))
                role = UserRole(role_val)
                if self.user_manager.add_user(username, password, email, role):
                    print("  Пользователь создан!")
                else:
                    print("  Ошибка!")
                input()

            elif choice == '3':
                username = input("  Имя пользователя для удаления: ")
                if self.user_manager.delete_user(username):
                    print("  Удалён!")
                else:
                    print("  Ошибка!")
                input()

            elif choice == '4':
                username = input("  Имя пользователя: ")
                role_val = int(input("  Новая роль (0-4): "))
                if self.user_manager.change_role(username, UserRole(role_val)):
                    print("  Роль изменена!")
                else:
                    print("  Ошибка!")
                input()

            elif choice == '0':
                break

    def show_task_management(self):
        while True:
            self.clear_screen()
            self.print_header()
            print("\n  [1] Показать задачи")
            print("  [2] Добавить задачу")
            print("  [3] Выполнить задачу")
            print("  [4] Показать все (включая выполненные)")
            print("  [0] Назад")
            choice = input("\n  Выберите действие: ")

            if choice == '1':
                tasks = self.task_manager.list_tasks(show_completed=False)
                print("\n  АКТИВНЫЕ ЗАДАЧИ:")
                for t in tasks:
                    print(f"  [{t['id']}] {t['title']} (Приоритет: {t['priority']})")
                input()

            elif choice == '2':
                title = input("  Название задачи: ")
                desc = input("  Описание: ")
                prio = input("  Приоритет (low/medium/high): ")
                self.task_manager.add_task(title, desc, prio)
                print("  Задача добавлена!")
                input()

            elif choice == '3':
                task_id = int(input("  ID задачи: "))
                self.task_manager.complete_task(task_id)
                input()

            elif choice == '4':
                tasks = self.task_manager.list_tasks(show_completed=True)
                for t in tasks:
                    status = "[X]" if t['completed'] else "[ ]"
                    print(f"  {status} [{t['id']}] {t['title']}")
                input()

            elif choice == '0':
                break

    def show_system_tools(self):
        while True:
            self.clear_screen()
            self.print_header()
            print("\n  [1] Создать бэкап users.json")
            print("  [2] Создать бэкап tasks.json")
            print("  [3] Список бэкапов")
            print("  [4] Показать лог")
            print("  [0] Назад")
            choice = input("\n  Выберите действие: ")

            if choice == '1':
                self.backup_manager.backup_file("users.json")
                input()
            elif choice == '2':
                self.backup_manager.backup_file("tasks.json")
                input()
            elif choice == '3':
                backups = self.backup_manager.list_backups()
                for b in backups:
                    print(f"  {b}")
                input()
            elif choice == '4':
                if os.path.exists("admin_log.txt"):
                    with open("admin_log.txt", 'r', encoding='utf-8') as f:
                        lines = f.readlines()[-20:]
                        print("\n  ПОСЛЕДНИЕ 20 СТРОК ЛОГА:")
                        for line in lines:
                            print(f"  {line.strip()}")
                input()
            elif choice == '0':
                break

    def run(self):
        while True:
            if not self.user_manager.current_user:
                if not self.login_screen():
                    continue

            self.clear_screen()
            self.print_header()
            print("\n  ГЛАВНОЕ МЕНЮ")
            print("-" * 40)
            print("  [1] Управление пользователями")
            print("  [2] Управление задачами")
            print("  [3] Системные инструменты")
            print("  [4] Выйти из аккаунта")
            print("  [0] Выход из программы")
            choice = input("\n  Ваш выбор: ")

            if choice == '1':
                self.show_user_management()
            elif choice == '2':
                self.show_task_management()
            elif choice == '3':
                self.show_system_tools()
            elif choice == '4':
                self.user_manager.logout()
            elif choice == '0':
                self.logger.info("Завершение работы")
                print("\n  До свидания!")
                break

# ================== Точка входа ==================
if __name__ == "__main__":
    panel = AdminPanel()
    panel.run()