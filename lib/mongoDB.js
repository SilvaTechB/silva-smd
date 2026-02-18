<<<<<<< HEAD
import mongoose from 'mongoose'

mongoose.set('strictQuery', false) // Disable strict query mode

const { Schema, connect, model: _model } = mongoose
=======
import { MongoClient } from 'mongodb'

>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
const defaultOptions = { useNewUrlParser: true, useUnifiedTopology: true }

export class MongoDB {
  constructor(url, options = defaultOptions) {
<<<<<<< HEAD
    /**
     * @type {string}
     */
    this.url = url
    /**
     * @type {mongoose.ConnectOptions}
     */
    this.options = options
    this.data = this._data = {}
    /**
     * @type {mongoose.Schema}
     */
    this._schema = {}
    /**
     * @type {mongoose.Model}
     */
    this._model = {}
    /**
     * @type {Promise<typeof mongoose>}
     */
    this.db = connect(this.url, { ...this.options })
      .then(db => {
        console.log('MongoDB connected') // Log when MongoDB is connected
        return db
      })
      .catch(console.error)
  }

  async read() {
    this.conn = await this.db
    let schema = (this._schema = new Schema({
      data: {
        type: Object,
        required: true, // depends on whether the field is mandatory or not
        default: {},
      },
    }))
    try {
      this._model = _model('data', schema)
    } catch {
      this._model = _model('data')
    }
    this._data = await this._model.findOne({})
    if (!this._data) {
      this.data = {}
      const [_, _data] = await Promise.all([this.write(this.data), this._model.findOne({})])
      this._data = _data
    } else this.data = this._data.data
    return this.data
  }

  write(data) {
    return new Promise(async (resolve, reject) => {
      if (!data) return reject(data)

      try {
        if (!this._data) {
          const newData = new this._model({ data })
          const savedData = await newData.save()
          this._data = savedData
        } else {
          const docs = await this._model.findById(this._data._id)
          if (!docs.data) docs.data = {}
          docs.data = data
          const savedData = await docs.save()
          this._data = savedData
        }
        this.data = {}
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })
  }
}
=======
    this.url = url
    this.options = options
    this.client = new MongoClient(this.url, this.options)
    this.db = null
    this.collection = null
    this.data = {}
  }

  async _init() {
    if (!this.db) {
      await this.client.connect()
      this.db = this.client.db() // Use default DB from URI
      this.collection = this.db.collection('botdata')
    }
  }

  async read() {
    await this._init()
    const doc = await this.collection.findOne({ _id: 'botdata' })
    if (doc && doc.data) {
      this.data = doc.data
    } else {
      this.data = {}
      await this.write(this.data)
    }
    return this.data
  }

  async write(data) {
    await this._init()
    this.data = data
    await this.collection.updateOne(
      { _id: 'botdata' },
      { $set: { data: this.data } },
      { upsert: true }
    )
    return true
  }

  async close() {
    if (this.client) await this.client.close()
  }
}
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
