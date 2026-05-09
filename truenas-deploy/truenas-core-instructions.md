# TrueNAS Core Deployment Instructions

TrueNAS Core does NOT have native Docker support. You need to create a Linux VM.

## Option A: Linux VM (Recommended)

### Step 1: Create a VM
1. Go to **Virtual Machines > Add**
2. Select **Linux** as Guest OS
3. Allocate:
   - **2 CPU cores**
   - **4 GB RAM**
   - **50 GB disk** (or more)
4. Install **Ubuntu Server 22.04 LTS**

### Step 2: Install Docker in the VM

SSH into your VM and run:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in
```

### Step 3: Copy Budget App Files

From your PC, copy files to the VM:
```bash
# On your PC (in Command Prompt or PowerShell)
scp -r C:\Users\Moid\budget-app username@vm-ip:/home/username/
```

Or use SMB to share a folder and mount it in the VM.

### Step 4: Deploy

Inside the VM:
```bash
cd ~/budget-app/truenas-deploy
sudo docker-compose up -d
```

### Step 5: First-Time Setup

```bash
cd ~/budget-app/truenas-deploy
sudo docker-compose exec backend python manage.py migrate
sudo docker-compose exec backend python manage.py createsuperuser
sudo docker-compose exec backend python manage.py seed_defaults --email=your-email@example.com
```

### Step 6: Access

Open browser and go to `http://vm-ip:8080`

---

## Option B: Direct Install on TrueNAS Core (No Docker)

If you prefer not to use a VM, install Python and PostgreSQL directly on TrueNAS Core via FreeBSD packages.

**Not recommended** — TrueNAS Core is based on FreeBSD and Django/PostgreSQL package management is more complex than a Linux VM.

**Use Option A (Linux VM) for the easiest setup.**
